@web @mobile @needs-server
Feature: The studio desk
  At an architecture programme a studio runs on a course offering with its stage days (brief, pin-up, final,
  jury); a jury of the faculty and outside jurors marks each student and the chair signs; students submit at
  each stage. ZZ Vidya College's AR101 studio czzststudio0000000001: the interim jury is signed with three
  marks, the final jury is ahead.

  @happy
  Scenario: The faculty's studios show the signed interim jury with every student marked
    Given I am signed in as the FACULTY
    When I GET "/api/v1/faculty/studios"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "studios" has "id" equal to "czzststudio0000000001"
    And some item of "studios[0].juries" has "id" equal to "czzstjury000000000001"
    And the field "studios[0].juries[0].marked" equals the field "studios[0].juries[0].students"
    And the field "studios[0].juries[0].signedAt" is present

  @happy
  Scenario: A student reads their studio and its stage days
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/family/studios"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "offered" equals true
    And some item of "studios" has "id" equal to "czzststudio0000000001"

  @alternative
  Scenario: The coordinator's desk may manage and convene
    Given I am signed in as the FACULTY
    When I GET "/api/v1/duties/studio"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "canManage" equals true

  @negative
  Scenario: A student cannot mark a jury
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I POST "/api/v1/faculty/studios/juries/czzstjury000000000002/marks" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: Marks with no rows are refused for their shape
    Given I am signed in as the FACULTY
    When I POST "/api/v1/faculty/studios/juries/czzstjury000000000002/marks" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A submission with nothing in it is refused for its shape
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I POST "/api/v1/family/studios/czzststudio0000000001/submissions" with:
      """
      {}
      """
    Then the status is 422
