@web @mobile @needs-server
Feature: Sessions and seats
  An expert offers one-to-ones and workshops to every school's pupils, and a teacher one-to-one guidance to their
  own school's once the office switches it on; a pupil has two free one-to-ones and two workshop seats a school
  year; a pupil's own ask waits for a guardian; the meeting link shows only while a seat is confirmed; the office
  reads and may cancel its pupils' bookings. Both features (EXPERT_SESSIONS, TEACHER_SESSIONS) are switched off on
  the dev database, so the doors answer 404 FEATURE_OFF to every role, and the scenarios that need them on are
  skipped for the environment rather than switched by the run.

  @happy
  Scenario: A pupil sees the sessions open to them and their year's allowance
    Given the platform feature "EXPERT_SESSIONS" is on
    And I am signed in as the STUDENT
    When I GET "/api/v1/gigs/sessions"
    Then the status is 200
    And the answer matches the catalog contract

  @happy
  Scenario: A provider lists their own slots
    Given the platform feature "EXPERT_SESSIONS" is on
    And I am signed in as the EXPERT
    When I GET "/api/v1/gigs/slots"
    Then the status is 200
    And the answer matches the catalog contract

  @alternative
  Scenario: The office reads its pupils' bookings
    Given the platform feature "EXPERT_SESSIONS" is on
    And I am signed in as the ADMIN
    When I GET "/api/v1/gigs/school"
    Then the status is 200
    And the answer matches the catalog contract

  @negative
  Scenario: While the operator has sessions off, every role meets FEATURE_OFF
    Given the platform feature "EXPERT_SESSIONS" is off
    And the platform feature "TEACHER_SESSIONS" is off
    And I am signed in as the PARENT
    When I GET "/api/v1/gigs/sessions"
    Then the status is 404
    And the error code is "FEATURE_OFF"
    Given I am signed in as the EXPERT
    When I GET "/api/v1/gigs/slots"
    Then the status is 404
    And the error code is "FEATURE_OFF"
    Given I am signed in as the ADMIN
    When I GET "/api/v1/gigs/school"
    Then the status is 404
    And the error code is "FEATURE_OFF"

  @negative
  Scenario: A booking with no slot is refused for its shape
    Given the platform feature "EXPERT_SESSIONS" is on
    And I am signed in as the PARENT
    When I POST "/api/v1/gigs/sessions/book" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A teacher cannot book a seat for a pupil
    Given I am signed in as the TEACHER
    When I POST "/api/v1/gigs/sessions/book" with:
      """
      {}
      """
    Then the status is one of 403, 404

  @alternative
  Scenario: A guardian pays for a workshop seat past the free allowance through the expert's Route account
    # Not run: decision 0004's amendments of 2 October 2026 keep paid seats off until Razorpay Route is proven on a
    # real account (the expert's share on hold); the operator's switch for them is gated.
    Given the environment provides a proven Razorpay Route account with paid seats switched on
    And I am signed in as the PARENT
    When I POST "/api/v1/gigs/sessions/{{booking}}/checkout"
    Then the status is 200
