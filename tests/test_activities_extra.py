from fastapi.testclient import TestClient
from src import app as mapp

client = TestClient(mapp.app)


def test_signup_duplicate_returns_400():
    activity = 'Debate Club'
    email = 'dup@example.com'

    # Ensure clean state
    if email in mapp.activities[activity]['participants']:
        mapp.activities[activity]['participants'].remove(email)

    resp1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp1.status_code == 200

    # Attempt duplicate signup
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400


def test_signup_activity_not_found_returns_404():
    resp = client.post(f"/activities/NonExistent/signup?email=test@example.com")
    assert resp.status_code == 404


def test_remove_nonexistent_participant_returns_404():
    activity = 'Science Club'
    email = 'notthere@example.com'

    # Ensure not present
    if email in mapp.activities[activity]['participants']:
        mapp.activities[activity]['participants'].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404


def test_remove_activity_not_found_returns_404():
    resp = client.delete(f"/activities/NoActivity/participants?email=test@example.com")
    assert resp.status_code == 404
