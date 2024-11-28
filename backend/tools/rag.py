# https://ai.google.dev/api/semantic-retrieval/question-answering
import google.ai.generativelanguage as glm
generative_service_client = glm.GenerativeServiceClient()
retriever_service_client = glm.RetrieverServiceClient()
permission_service_client = glm.PermissionServiceClient()

example_corpus = glm.Corpus(display_name="Google for Developers Blog")
create_corpus_request = glm.CreateCorpusRequest(corpus=example_corpus)

# Make the request
create_corpus_response = retriever_service_client.create_corpus(create_corpus_request)

# Set the `corpus_resource_name` for subsequent sections.
corpus_resource_name = create_corpus_response.name
print(create_corpus_response)

get_corpus_request = glm.GetCorpusRequest(name=corpus_resource_name)

# Make the request
get_corpus_response = retriever_service_client.get_corpus(get_corpus_request)

# Print the response
print(get_corpus_response)

# Create a document with a custom display name.
example_document = glm.Document(display_name="Introducing Project IDX, An Experiment to Improve Full-stack, Multiplatform App Development")

# Add metadata.
# Metadata also supports numeric values not specified here
document_metadata = [
    glm.CustomMetadata(key="url", string_value="https://developers.googleblog.com/2023/08/introducing-project-idx-experiment-to-improve-full-stack-multiplatform-app-development.html")]
example_document.custom_metadata.extend(document_metadata)

# Make the request
# corpus_resource_name is a variable set in the "Create a corpus" section.
create_document_request = glm.CreateDocumentRequest(parent=corpus_resource_name, document=example_document)
create_document_response = retriever_service_client.create_document(create_document_request)

# Set the `document_resource_name` for subsequent sections.
document_resource_name = create_document_response.name
print(create_document_response)

get_document_request = glm.GetDocumentRequest(name=document_resource_name)

# Make the request
# document_resource_name is a variable set in the "Create a document" section.
get_document_response = retriever_service_client.get_document(get_document_request)

# Print the response
print(get_document_response)

