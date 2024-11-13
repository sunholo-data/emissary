from sunholo.agents import VACRoutes, create_app

from vac_service import vac_stream

app = create_app(__name__)

# Register the Q&A routes with the specific interpreter functions
# creates endpoints /vac/streaming/<vector_name> and /vac/<vector_name> etc.
VACRoutes(app, vac_stream)

# start via `python app.py`
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=1956, debug=True)

