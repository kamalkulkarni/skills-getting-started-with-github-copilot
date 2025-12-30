from fastapi.testclient import TestClient
from src import app as mapp

client = TestClient(mapp.app)


def test_signup_updates_activities():
    # Ensure email not already present
    activity = 'Tennis Club'
    email = 'tester@example.com'
    # remove if exists
    if email in mapp.activities[activity]['participants']:
        mapp.activities[activity]['participants'].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    data = resp.json()
    assert 'Signed up' in data['message']

    # Fetch activities and ensure participant is present
    resp2 = client.get('/activities')
    assert resp2.status_code == 200
    activities = resp2.json()
    assert email in activities[activity]['participants']


def test_remove_participant():
    activity = 'Tennis Club'
    email = 'tester@example.com'

    # Ensure present
    if email not in mapp.activities[activity]['participants']:
        mapp.activities[activity]['participants'].append(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    data = resp.json()
    assert 'Removed' in data['message']

    # Fetch activities and ensure participant is gone
    resp2 = client.get('/activities')
    activities = resp2.json()
    assert email not in activities[activity]['participants']
