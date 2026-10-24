@mobile
Feature: The phone's offline queue
  A write made with no network is queued on the phone with a device-minted client id, stamped with the person
  signed in and the school they are at. A flush sends that person's rows for that school, oldest first: a 2xx
  removes a row, a refusal for good (a 4xx other than 401 and 429) drops it and says so, anything else keeps it
  for the next try. Another person's rows, and this person's rows of another school, are held and never sent;
  past seven days they are dropped unsent. Signing out drops the person's own rows. These scenarios drive the
  phone's own library (apps/mobile/src/lib/outbox.ts) with the network the scenario describes.

  Background:
    Given the phone's outbox is empty
    And the phone is signed in as "zz-bdd-teacher" at "zz-bdd-school"

  @happy
  Scenario: Rows queued offline go out oldest first when the network is back
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the phone queues POST "/api/attendance" with:
      """
      { "n": 2 }
      """
    And the network is down and the outbox flushes
    Then the outbox holds 2 rows for the person signed in
    And every waiting row has been tried 1 time
    When the network answers every request with 200 and the outbox flushes
    Then 2 rows were sent
    And the rows were sent in the order they were queued
    And the outbox holds 0 rows for the person signed in

  @alternative
  Scenario: A row the server is busy for (5xx), or that needs a new sign-in (401), stays for the next try
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the network answers every request with 503 and the outbox flushes
    Then the outbox holds 1 row for the person signed in
    When the network answers every request with 401 and the outbox flushes
    Then the outbox holds 1 row for the person signed in
    And the waiting row has been tried 2 times
    When the network answers every request with 429 and the outbox flushes
    Then the outbox holds 1 row for the person signed in

  @alternative
  Scenario: A row queued at one school is held while the same person is at another, and sent on the way back
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the phone is signed in as "zz-bdd-teacher" at "zz-bdd-other-school"
    And the network answers every request with 200 and the outbox flushes
    Then 0 rows were sent
    And the outbox holds 0 rows for the person signed in
    When the phone is signed in as "zz-bdd-teacher" at "zz-bdd-school"
    And the network answers every request with 200 and the outbox flushes
    Then 1 row was sent

  @negative
  Scenario: A row the server refuses for good is dropped and reported
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the network answers every request with 422 and the outbox flushes
    Then the outbox holds 0 rows for the person signed in
    And the outbox reported 1 rejected with status 422

  @negative
  Scenario: Another person's rows are never sent under the next person, and lapse after seven days
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the phone is signed in as "zz-bdd-someone-else" at "zz-bdd-school"
    And the network answers every request with 200 and the outbox flushes
    Then 0 rows were sent
    When 8 days pass
    And the network answers every request with 200 and the outbox flushes
    And the phone is signed in as "zz-bdd-teacher" at "zz-bdd-school"
    And the network answers every request with 200 and the outbox flushes
    Then 0 rows were sent
    And the outbox holds 0 rows for the person signed in

  @negative
  Scenario: Signing out drops the person's own unsent rows
    When the phone queues POST "/api/attendance" with:
      """
      { "n": 1 }
      """
    And the person signs out of the phone
    And the phone is signed in as "zz-bdd-teacher" at "zz-bdd-school"
    Then the outbox holds 0 rows for the person signed in
