@web @mobile @needs-server
Feature: Report cards
  A class's cards are generated from its marks under the school's rules (kind and term weighting, bands),
  published a class at a time, and read by the family; the PDF is set with the shipped Devanagari font.

  @happy
  Scenario: A guardian reads a published card whose figures follow the school's weighting
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/report-cards"
    Then the status is 200
    And the answer matches the catalog contract
    When I remember the "rows[0].id" of the first item of "groups" whose "name" equals "ZZ Aarav Apte" as "card"
    And I GET "/api/v1/family/report-cards/{{card}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "status" equals "PUBLISHED"
    And every item of "subjects" has "percent" equal to the weighted mean of its "percent" by "weight" over "parts"
    And the field "overallPercent" equals the rounded mean of "percent" over "subjects"

  @happy
  Scenario: The card's PDF opens for the guardian
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/report-cards"
    And I remember the "rows[0].id" of the first item of "groups" whose "name" equals "ZZ Aarav Apte" as "card"
    And I GET "/api/v1/shared/report-cards/{{card}}/pdf"
    Then the status is 200
    And the content type contains "application/pdf"

  @alternative
  Scenario: The class teacher sees the class's assessments and how many are graded
    Given I am signed in as the TEACHER zz.teacher1@zz.test
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" whose "name" equals "ZZ Grade 3 · A" as "classId"
    And I GET "/api/v1/teaching/classes/{{classId}}/report-cards"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "assessments" is a list of at least 1 item

  @alternative
  Scenario: The office reads the school's rules: bands from the top down
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/report-card-config"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "bands[0].minPercent" is more than 80

  @negative
  Scenario: Publishing with no title is refused for its shape
    Given I am signed in as the TEACHER zz.teacher1@zz.test
    When I GET "/api/v1/staff/attendance/classes"
    And I remember the "id" of the first item of "classes" whose "name" equals "ZZ Grade 3 · A" as "classId"
    And I POST "/api/v1/teaching/classes/{{classId}}/report-cards/publish" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: Another family cannot open the card
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/report-cards"
    And I remember the "rows[0].id" of the first item of "groups" whose "name" equals "ZZ Aarav Apte" as "card"
    Given I am signed in as the PARENT zz.parent02@zz.test
    When I GET "/api/v1/family/report-cards/{{card}}"
    Then the status is one of 403, 404
    When I GET "/api/v1/shared/report-cards/{{card}}/pdf"
    Then the status is one of 403, 404

  @negative
  Scenario: The head reads the rules but only the office admin changes them
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/office/report-card-config"
    Then the status is 200
    When I POST "/api/v1/office/report-card-config" with:
      """
      {}
      """
    Then the status is 403
