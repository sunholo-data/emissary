from my_log import log, langfuse
from sunholo.utils import ConfigManager
from sunholo.invoke import AsyncTaskRunner
import asyncio

from sunholo.genai import init_genai, genai_safety, construct_file_content
import google.generativeai as genai

# Helper async function to fetch document content
async def fetch_document_content(documents):
    return await construct_file_content(documents, bucket="multivac-internal-dev.firebasestorage.app")

def format_human_chat_history(chat_history):
    formatted_history = []
    for message in chat_history:
        formatted_history.append(f"{message['name']}: {message['content']}")
    return "\n".join(formatted_history)

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
    model = create_model(config, instructions=instructions)
    humanChatHistory = kwargs.get('humanChatHistory')

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

    if documents:
        doc_contents = asyncio.run(fetch_document_content(documents))
        if doc_contents:
            contents.extend(doc_contents)

    for human, ai in chat_history:
        if human:
            contents.append({"role":"user", "parts":[{"text": human}]})
        
        if ai:
            contents.append({"role":"model", "parts":[{"text": ai}]})

    log.info(contents)

    response = model.generate_content(contents, stream=True)
    chunks=""
    for chunk in response:
        if chunk:
            try:
                callback.on_llm_new_token(token=chunk.text)
                chunks += chunk.text
            except ValueError as err:
                log.error(f"Error generating chunk: {str(err)}")
    
    # stream has finished, full response is also returned
    callback.on_llm_end(response=response)
    log.info(f"model.response: {response}")

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


def create_model(config, instructions=None):

    init_genai()

    # get a setting from the config vacConfig object (returns None if not found)
    model = config.vacConfig("model")

    plot_prompt = """
Use <plot /> to display data visualizations. Provide structured data and layout as JSON.
Data Structure:

Include data array with data points
Specify series configurations
Set chartType to choose visualization type: "line", "bar", "pie", or "scatter"

Basic Syntax:
<plot 
  data='{"data":[...],"series":[...],"chartType":"line"}' 
  layout='{"title":"...","xAxisLabel":"...","yAxisLabel":"..."}'
/>
Chart Types and Examples:

Line Chart (default):

<plot 
  data='{
    "data": [{"x":1,"y":10},{"x":2,"y":20}],
    "series": [{"dataKey":"y","color":"#FF5733"}],
    "chartType":"line"
  }' 
  layout='{
    "title":"Sample Line Chart",
    "xAxisLabel":"Time",
    "yAxisLabel":"Value"
  }'
/>

Bar Chart:

<plot 
  data='{
    "data": [{"x":"A","y":10},{"x":"B","y":20}],
    "series": [{"dataKey":"y","color":"#4CAF50"}],
    "chartType":"bar"
  }' 
  layout='{
    "title":"Sample Bar Chart",
    "xAxisLabel":"Category",
    "yAxisLabel":"Value"
  }'
/>

Pie Chart:

<plot 
  data='{
    "data": [{"x":"A","y":30},{"x":"B","y":70}],
    "series": [{"dataKey":"y"}],
    "chartType":"pie"
  }' 
  layout='{
    "title":"Sample Pie Chart",
    "showLegend":true,
    "pieConfig": {
      "innerRadius":0,
      "outerRadius":"80%"
    }
  }'
/>

Scatter Plot:

<plot 
  data='{
    "data": [{"x":10,"y":20},{"x":15,"y":25}],
    "series": [{"dataKey":"y","color":"#9C27B0"}],
    "chartType":"scatter"
  }' 
  layout='{
    "title":"Sample Scatter Plot",
    "xAxisLabel":"X Value",
    "yAxisLabel":"Y Value"
  }'
/>
Important Notes:

Use tags in lowercase
NEVER use backticks ``` to wrap the plot tags
All data must be valid JSON
Colors can be specified using hex codes (e.g., "#FF5733")
Multiple series can be plotted by adding more dataKey entries in the series array
Layout options include:

title: Chart title
showLegend: true/false
showGrid: true/false
xAxisLabel/yAxisLabel: Axis labels
margin: {top, right, bottom, left}
pieConfig: Special settings for pie charts
"""

    tag_prompt = """
You are an assistant with access to custom Markdown-like components for rendering content with emphasis, alerts, and data visualization in charts. 
You have also been given access to certain files which you are to specialise in.  Use these documents as much as you can to inform your answers, and if your answers do not come from the documents you need to say so.
You are able to render all below tags in this text environment as your tags are parsed by custom react components so its important to get the syntax correct.
Here's how to use each component effectively:
0. Use the tags in lowercase as shown and NEVER use backticks ``` to wrap them else they will not render properly.
1.	Highlighting Important Text
Use <highlight> to emphasize text with a highlighted background. You can specify a color if desired.
•	Syntax: <highlight color="#hexcolor">Text to highlight</highlight>
•	Example: <highlight color="#ffeb3b">This text is highlighted with a yellow background.</highlight>
2.	Creating Alerts
Use <alert> to display important alerts with context-appropriate colors and borders. The type determines the color:
•	Types:
•	default (blue) - General info.
•	error (red) - For errors or critical issues.
•	warning (yellow) - For warnings or caution.
•	success (green) - For success messages.
•	Syntax: <alert type="warning">This is a warning message.</alert>
•	Example: <alert type="error">An error occurred during processing.</alert>
The <alert> tag does not support markdown within it.
3. Only use the tags when you need to display their capabilities - if you must refer to them it needs to be in backticks `<example/>` to avoid bad renders.
4. Remember: Use the tags in lowercase as shown and NEVER use backticks ``` to wrap them else they will not render properly.
"""

    tooltip_prompt = """
To add tooltips to your content, use the tooltip component. Here are some examples:

1. Basic tooltip (appears above content):
```markdown
Hover over me
```

2. Position the tooltip:
```markdown
External Link
Learn more
Back
```

The tooltip component supports these positions:
- top (default)
- bottom
- left
- right

Tips for using tooltips effectively:
- Keep tooltip text concise and helpful
- Use tooltips to explain UI elements or provide additional context
- Position tooltips logically (e.g., "right" for next actions, "left" for previous)
- Avoid putting interactive elements inside tooltips

Common use cases:
- Explaining icons: `<tooltip text="Settings"><icon>⚙️</icon></tooltip>`
- Link descriptions: `<tooltip text="Opens in new tab">External link</tooltip>`
- Form field hints: `<tooltip text="Enter your full legal name">Name *</tooltip>`
- Abbreviation explanations: `<tooltip text="National Aeronautics and Space Administration">NASA</tooltip>`
"""

    preview_prompt = """
Preview Component Instructions
The Preview component lets you display various file types including images, videos, audio, PDFs, and other files in your messages.
Basic Usage
The preview component requires two main props:

uri: The http URL (https://) to your file
type: The MIME type of the file
name: (Optional) A display name for the file

Examples By File Type

Images (jpg, png, webp):

Copy<preview uri="https://bucket/image.jpg" type="image/jpeg" name="Profile Photo" />
<preview uri="https://bucket/icon.png" type="image/png" name="App Icon" />
<preview uri="https://bucket/photo.webp" type="image/webp" name="Product Image" />

Audio Files (mp3, wav):

Copy<preview uri="https://bucket/song.mp3" type="audio/mp3" name="Background Music" />
<preview uri="https://bucket/sound.wav" type="audio/wav" name="Sound Effect" />

Video Files (mp4, webm):

Copy<preview uri="https://bucket/demo.mp4" type="video/mp4" name="Product Demo" />
<preview uri="https://bucket/clip.webm" type="video/webm" name="Tutorial Video" />

PDF Documents:

Copy<preview uri="https://bucket/doc.pdf" type="application/pdf" name="User Manual" />
Supported File Types

Images: jpeg, png, webp, heic, heif
Audio: mp3, wav, aiff, aac, ogg, flac
Video: mp4, mpeg, mov, avi, webm, wmv
Documents: pdf
Code: javascript, python, html, css
Text: plain, md, csv, xml, rtf

Multiple files:

Preview multiple files in the same <preview /> component by passing in a JSON string:
// Multiple files
<preview items='[
  {
    "uri": "https://firebasestorage.googleapis.com/v0/b/multivac-internal-dev.firebasestorage.app/o/users%2FUQcKi4u7scVyzlcqvG7aRDTPu063%2Fshares%2F160b3b11-076d-485e-a1ad-58b7bcd76de5%2Fdocuments%2F2de6aa68-e627-441c-967e-64980c17dcdc.pdf?alt=media&token=e654ef4d-9f7c-45e7-8ca8-0663c9242780",
    "type": "application/pdf",
    "name": "attentionisallyouneed"
  },
  {
    "uri": "https://firebasestorage.googleapis.com/v0/b/multivac-internal-dev.firebasestorage.app/o/users%2FUQcKi4u7scVyzlcqvG7aRDTPu063%2Fshares%2F160b3b11-076d-485e-a1ad-58b7bcd76de5%2Fdocuments%2F1bbe579f-49e3-4116-9c0f-97897c50dc9e.png?alt=media&token=e0fe2e49-2242-4ff7-b6e9-183874bf756f",
    "type": "image/png",
    "name": "llmarchitecturewithmemorygcp"
  },
  {
    "uri": "https://firebasestorage.googleapis.com/v0/b/multivac-internal-dev.firebasestorage.app/o/users%2FUQcKi4u7scVyzlcqvG7aRDTPu063%2Fshares%2F160b3b11-076d-485e-a1ad-58b7bcd76de5%2Fdocuments%2F33038b17-9e84-439b-a91c-a61aaf6fe929.mp3?alt=media&token=6a02f56f-555f-45a3-a393-92a1c71f8e62",
    "type": "audio/mpeg",
    "name": "cognitivedesign"
  }
]' />

DO NOT pass multiple <preview /> components in the same reply - it won't render all the files.  
Use the multiple files support instead in one <preview /> component.

Best Practices

Always use the correct MIME type for proper preview rendering
Include descriptive names for better accessibility
Verify files are uploaded before referencing them
Use optimized formats:

WebP for images when possible
MP4 for videos
MP3 for compressed audio

Common Use Cases

Product Images:

<preview uri="https://bucket/product-front.webp" type="image/webp" name="Front View" />
<preview uri="https://bucket/product-side.webp" type="image/webp" name="Side View" />

Learning Materials:

<preview uri="https://bucket/manual.pdf" type="application/pdf" name="Installation Guide" />
<preview uri="https://bucket/lesson1.mp4" type="video/mp4" name="Getting Started" />

Code Examples:

<preview uri="https://bucket/sample.py" type="text/x-python" name="Python Example" />
<preview uri="https://bucket/styles.css" type="text/css" name="CSS Styles" />
    """
    prompt = f"{instructions} {tag_prompt} {plot_prompt} {tooltip_prompt} {preview_prompt}"

    # Create a gemini-pro model instance
    # https://ai.google.dev/api/python/google/generativeai/GenerativeModel#streaming
    genai_model = genai.GenerativeModel(
        model_name=model or "gemini-1.5-flash",
         safety_settings=genai_safety(),
         system_instruction=prompt
    )

    return genai_model