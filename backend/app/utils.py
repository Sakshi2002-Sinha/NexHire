import json


def dump_list(items):
    """Store a list of strings in a Text column as JSON."""
    return json.dumps(items or [])


def load_list(text):
    """Read a list stored by dump_list.

    Older rows were saved as ", "-joined text, so fall back to splitting.
    """
    if not text:
        return []

    try:
        value = json.loads(text)
        if isinstance(value, list):
            return [str(item) for item in value]
    except (json.JSONDecodeError, TypeError):
        pass

    return [item for item in text.split(", ") if item]
