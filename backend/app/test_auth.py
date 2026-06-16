from app.auth import hash_password, verify_password

password = "sakshi123"

hashed = hash_password(password)

print("Original:", password)
print("Hashed:", hashed)

print(
    verify_password(
        "sakshi123",
        hashed
    )
)