from sunholo.custom_logging import setup_logging
from langfuse import Langfuse

langfuse = Langfuse()
log = setup_logging("emissary")
