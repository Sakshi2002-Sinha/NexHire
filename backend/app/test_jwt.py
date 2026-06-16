from app.auth import create_access_token

token = create_access_token(
    {"sub": "sakshi@gmail.com"}
)

print(token)