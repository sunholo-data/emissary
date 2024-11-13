# Template VAC Project

This is a template VAC project created with `sunholo init my_vac_project`


## Test calls


```shell
export FLASK_URL=http://localhost:1956
curl -X POST ${FLASK_URL}/vac/template \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "What do you know about MLOps?"
}'

curl $VAC_URL/vac/streaming/template \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "What do you know about MLOps?"
}'

export VAC_URL=https://uimessenger-374404277595.europe-west1.run.app/api/proxy
curl $VAC_URL \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/vac/streaming/emissary",
    "user_input": "What do you know about MLOps?"
}'
```