# https://ai.google.dev/gemini-api/docs/grounding?lang=python
from sunholo.genai import init_genai, genai_safety, construct_file_content
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
import json
from my_log import log, langfuse

def create_google_search_component_string(gemini_response: GenerateContentResponse) -> str:
    """
    Creates a React component string from a Gemini API response.
    
    Args:
        gemini_response (dict): The Gemini API response containing search data
        
    Returns:
        str: A string representation of the React component with props
    """
    try:
        # Extract the first candidate's content and metadata
        candidate = gemini_response['candidates'][0]
        grounding_metadata = candidate.get('groundingMetadata', {})
        if not grounding_metadata:
            log.info("No grounding metadata found")
            return ''
        
        # Get search entry point content
        search_entry_point = grounding_metadata.get('searchEntryPoint', {}).get('renderedContent', '')
        
        # Get grounding chunks (sources)
        chunks = grounding_metadata.get('groundingChunks', [])
        sources = [
            {
                'uri': chunk.get('web', {}).get('uri', ''),
                'title': chunk.get('web', {}).get('title', '')
            }
            for chunk in chunks
        ]
        
        # Get text segments and their confidence scores
        supports = grounding_metadata.get('groundingSupports', [])
        segments = [
            {
                'text': support.get('segment', {}).get('text', ''),
                'confidence': max(support.get('confidenceScores', [0])),
                'sources': [chunks[idx].get('web', {}).get('uri', '') 
                          for idx in support.get('groundingChunkIndices', [])]
            }
            for support in supports
        ]
        
        # Get search queries
        queries = grounding_metadata.get('webSearchQueries', [])
        
        # Create the component string with escaped props
        component_string = (
            f'<GoogleSearch\n'
            f'  searchEntryPoint={json.dumps(search_entry_point)}\n'
            f'  sources={json.dumps(sources)}\n'
            f'  segments={json.dumps(segments)}\n'
            f'  queries={json.dumps(queries)}\n'
            f'/>'
        )
        
        return component_string
    
    except Exception as e:
        return f'<GoogleSearch error={json.dumps(str(e))} />'
    

