from my_log import log, langfuse
from tools.google_search import create_google_search_component_string
from sunholo.utils import ConfigManager
from sunholo.langfuse.prompts import load_prompt_from_yaml
#from sunholo.invoke import AsyncTaskRunner
import asyncio
import os
import re

from sunholo.genai import init_genai, genai_safety, construct_file_content
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse

FREE_TOKEN_LIMIT = 128000

def create_model_tools(tools):
    model_tools =[]
    if tools:
    
        if "google_search_retrieval" in tools:
            model_tools.append(
                genai.protos.Tool(
                    google_search_retrieval = genai.protos.GoogleSearchRetrieval(
                        dynamic_retrieval_config = genai.protos.DynamicRetrievalConfig(
                        mode = genai.protos.DynamicRetrievalConfig.Mode.MODE_DYNAMIC,
                        dynamic_threshold = 0.3,
                        ),
                    ),
                ),
            )

        if "code_execution" in tools:
            model_tools["code_execution"] = {}

        if "google_search_retrieval" in tools and "code_execution" in tools:
            log.warning("Can't use google_search_retrieval and code_exeution in same call(?)")

    log.info(f"{model_tools=}")
    return model_tools

# Helper async function to fetch document content
async def fetch_document_content(documents):
    FIREBASE_BUCKET = os.environ.get('FIREBASE_BUCKET', 'multivac-internal-dev.firebasestorage.app') 
    return await construct_file_content(documents, bucket=FIREBASE_BUCKET)

def format_human_chat_history(chat_history):
    formatted_history = []
    for message in chat_history:
        formatted_history.append(f"{message['name']}: {message['content']}")
    return "\n".join(formatted_history)

def first_impression(contents, instructions, trace=None):

    system_msg = (f"Make sure to keep the persona and follow the instructions you have been given: {instructions}. "
                  "The full answer will be delivered later, for now you need only give them a quick first impressions and answer to show you are thinking about it. "
                  "Communicate back to the user you have received their question and state it back to them to show you have understood it.")
    safe = genai_safety()
    model_name="gemini-1.5-flash"

    gen = trace.generation(
        name="first_response",
        model=model_name,
        input = {'system_instruction': system_msg, 'contents': contents},
    )
    model = genai.GenerativeModel(
        model_name=model_name,
        safety_settings=safe,
        system_instruction=system_msg,
    )

    msg = "Let me look at that and get back to you with more detail."
    try:
        log.info(f"{contents=}")
        response = model.generate_content(contents)
        if response:
            try:
                msg = response.text
            except Exception as e:
                log.error(f"response.text not working for {response} - {str(e)}")
    except Exception as e:
        msg = f"Error in first_impression: {str(e)}"

    gen.end(output=msg)
    
    return msg

def vac_stream(question: str, vector_name:str, chat_history=[], callback=None, **kwargs):

    config = ConfigManager(vector_name)

    trace_id = None
    trace = None
    if kwargs.get("trace_id") is not None:
        trace_id = kwargs.get('trace_id')
        trace = langfuse.trace(id=trace_id, name="emissary")
        trace_id=trace.id
        log.info(f"Got langfuse trace: {trace_id}")

    instructions = kwargs.get('instructions')
    documents = kwargs.get('documents')
    humanChatHistory = kwargs.get('humanChatHistory')
    emissaryConfig = kwargs.get('emissaryConfig')
    tools = []
    toolConfigs = {}
    selectedItems = [] # for file-explorer tool
    if emissaryConfig is not None:
        tools = emissaryConfig.get('tools')
        toolConfigs = emissaryConfig.get('toolConfigs')
        selectedItems = emissaryConfig.get('selectedItems')

    contents = []
    
    if humanChatHistory:
        humans = format_human_chat_history(humanChatHistory)
        human_history = ("The following is a record of a historic discussion between the administrator of the emissary and the user that is talking with you now: "
                        f"<human_discussion>{humans}</human_discussion>"
                        "The human discussion may be relevant to the conversation as you are acting on behalf of the administrator and could help in their answers. "
                        "You can also use the receiver's questions as context with what they need help with, and answer on behalf of the administrator if you can help.")
        contents.append(
            {"role": "user", "parts":[{"text": human_history}]}
        )
    
    for human, ai in chat_history:
        if human:
            contents.append({"role":"user", "parts":[{"text": human}]})
        if ai:
            contents.append({"role":"model", "parts":[{"text": ai}]})
    
    initial_question = question
    if tools:
        initial_question = f"<question>{question}</question> You have been given access to these tools:<tools>{tools}</tools>"
    if toolConfigs:
        initial_question = f"{initial_question} The tools have been configured with these settings:<toolconfig>{toolConfigs}</toolconfig>"
    if selectedItems:
        initial_question = f"{initial_question} The file-browser tool was used to select these items: <selectedItems>{selectedItems}<selectedItems>"

    contents.append({"role": "user", "parts":[ {"text": initial_question} ] })

    first_response = first_impression(contents, instructions=instructions, trace=trace)
    log.info(f"First response: {first_response}")
    callback.on_llm_new_token(token=f"{first_response}\n\n")

    model_dict = create_model(config, instructions=instructions, tools=tools, trace_id=trace_id)
    model = model_dict["model"]
    system_prompt = model_dict["system_prompt"]
    system_tokens = model_dict["system_tokens"]

    span = langfuse.span(
        trace_id=trace_id,
        name="content",
        input={"question": question, 
               "chat_history": chat_history, 
               "kwargs": kwargs, 
               "system_prompt": system_prompt},
    )

    if documents:
        doc_contents = asyncio.run(fetch_document_content(documents))
        if doc_contents:
            contents.extend(doc_contents)

    continue_prompt = ("Please continue expanding on your answer."
                      f"Make sure you obey these instructions: {system_prompt}. "
                       "Don't repeat yourself, but also make sure you are fully addressing my last message.")
    contents.append({"role":"model", "parts":[{"text": first_response}]})
    contents.append({"role":"user", "parts":[{"text": continue_prompt}]})

    span.end(output = contents)

    model_name = config.vacConfig("model") or "gemini-1.5-flash"

    gen = trace.generation(
        name="generate",
        model=model_name,
        input=contents,
    )
    
    chunks=""
    log.info(f"Calling count_tokens to test {FREE_TOKEN_LIMIT} tokens")
    tokens = model.count_tokens(contents)
    total_tokens = tokens.total_tokens
    log.info(f"{tokens=} {total_tokens=} {system_tokens.total_tokens=}")

    if total_tokens is None:
        chunks = "Could not calculate total tokens so aborting request."
        callback.on_llm_new_token(token=chunks)
        response=None
    if total_tokens > FREE_TOKEN_LIMIT:
        chunks = f"The total tokens sent to the emissary was [{total_tokens}] which is greater than [{FREE_TOKEN_LIMIT}].  Consider upgrading or reduce document size."
        callback.on_llm_new_token(token=chunks)
        response=None

    usage = {
        "input":system_tokens.total_tokens,
        "output":0, #TODO: first_impression output
        "total":system_tokens.total_tokens,
        "unit": "TOKENS"
    }
    usage_metadata = {}

    if not chunks:
      log.info(f"Tokens {total_tokens} < {FREE_TOKEN_LIMIT} tokens so calling model")

      try:
        response: GenerateContentResponse = model.generate_content(contents, stream=True)
        for chunk in response:
            if chunk:
                try:
                    parsed_chunk = chunk.text
                    # to stop parsing errors when exeuting code
                    if '```' in chunk.text:
                        parsed_chunk = re.sub(r'```(?!\n)', '```\n', chunk.text)
                    callback.on_llm_new_token(token=parsed_chunk)
                    chunks += parsed_chunk
                except ValueError as err:
                    log.error(f"Error generating chunk: {str(err)}")

        if "google_search_retrieval" in tools:
            google_search_component = create_google_search_component_string(response)
            if google_search_component:
                callback.on_llm_new_token(token=google_search_component)
        
        usage_metadata = response.usage_metadata
        usage["input"] = usage["input"] + usage_metadata.prompt_token_count
        usage["output"] = usage["output"] + usage_metadata.candidates_token_count
        usage["total"]  = usage["total"] + usage_metadata.total_token_count
        log.info(f"model.response: {response} {usage_metadata=}")

      except Exception as err:
          msg = f"\n\nError generating response from {model_name=}: {str(err)}"
          callback.on_llm_new_token(token=msg)
          contents.append({"role":"model", "parts":[{"text": msg}]})
          contents.append({"role":"user", "parts":[{"text": "Please report what you think went wrong with the request that produced the error above" }]})
          try:
            # no tools
            err_response: GenerateContentResponse = model.generate_content(contents, stream=True)
            for chunk in err_response:
              if chunk:
                  try:
                      callback.on_llm_new_token(token=chunk.text)
                      chunks += chunk.text
                  except ValueError as err:
                      log.error(f"Error generating chunk: {str(err)}")
          
            usage_metadata = err_response.usage_metadata
            usage["input"] = usage_metadata.prompt_token_count
            usage["output"] = usage_metadata.candidates_token_count
            usage["total"]  = usage_metadata.total_token_count
            log.info(f"model.response: {err_response} {usage_metadata=}")
            response = err_response
          except Exception as err:
            msg = f"\n\nError generating error reporting response from {model_name=}: {str(err)}"
            callback.on_llm_new_token(token=msg)
            response = {}
    
    # stream has finished, full response is also returned
    callback.on_llm_end(response=response)

    gen.end(output=chunks, usage=usage)

    metadata = {
        "question": question,
        "vector_name": vector_name,
        "contents": contents,
    }

    trace.update(
        output=chunks, metadata=metadata
    )

    # to not return this dict at the end of the stream, pass stream_only: true in request
    return {"answer": chunks, "metadata": metadata}


def create_model(config, instructions=None, tools=None, trace_id=None):

    span = langfuse.span(
        trace_id=trace_id,
        name="system_instructions",
        input={"instructions": instructions},
    )

    init_genai()

    # get a setting from the config vacConfig object (returns None if not found)
    model = config.vacConfig("model")

    prompts = {
        tool: load_prompt_from_yaml(tool, prefix="emissary") or ""
        for tool in tools
    }

    log.info(f"prompts for tools: {prompts.keys()=}")

    prompts["system"] = load_prompt_from_yaml("system", prefix="emissary") or ""

    system_prompt = " ".join([instructions or ""] + [p for p in prompts.values() if p is not None])

    model_tools = create_model_tools(tools)
    genai_model = genai.GenerativeModel(
        model_name=model or "gemini-1.5-flash",
         safety_settings=genai_safety(),
         system_instruction=system_prompt,
         tools=model_tools
    )

    system_tokens = genai_model.count_tokens([system_prompt])
    span.end(output=system_prompt, metadata=system_tokens)

    return {"model": genai_model, 
            "system_tokens": system_tokens, 
            "prompts": prompts,
            "system_prompt": system_prompt}