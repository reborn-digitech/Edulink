@web @mobile @needs-server
Feature: Library
  The librarian keeps titles, copies by accession number, issues, returns, renewals, reservations, fines and
  the stocktake; a member reads their own loans and reserves a title. The fixture's titles and copies are
  ZZ-prefixed (scripts/zz-library-hostel.ts).

  @happy
  Scenario: The librarian searches the catalogue; no title has more available than it has copies
    Given I am signed in as the LIBRARIAN
    When I GET "/api/v1/library/titles?q=ZZ"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "items" is a list of at least 1 item
    And every item of "items" has "available" no more than its "copies"

  @happy
  Scenario: The librarian looks a copy up by its accession number
    Given I am signed in as the LIBRARIAN
    When I GET "/api/v1/library/lookup?code=ZZ-0001"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "kind" equals "COPY"
    And the field "copy.accession" equals "ZZ-0001"

  @happy
  Scenario: The overdue list holds only loans past their due day and not returned
    Given I am signed in as the LIBRARIAN
    When I GET "/api/v1/library/overdue"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "items" is a list of at least 1 item
    And every item of "items" has "dueOn" before "{{today}}"
    And every item of "items" has "returnedAt" equal to null

  @alternative
  Scenario: A pupil reads their own loans, within their limit
    Given I am signed in as the STUDENT
    When I GET "/api/v1/library/mine"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "loans" has no more items than the field "limit"

  @alternative
  Scenario: The head reads the library's reports
    Given I am signed in as the PRINCIPAL
    When I GET "/api/v1/library/reports"
    Then the status is 200
    And the answer matches the catalog contract

  @negative
  Scenario: A pupil cannot issue a book
    Given I am signed in as the STUDENT
    When I POST "/api/v1/library/issues" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: An issue with no copy and no member is refused for its shape
    Given I am signed in as the LIBRARIAN
    When I POST "/api/v1/library/issues" with:
      """
      {}
      """
    Then the status is 422

  @negative
  Scenario: A school without the library module is answered MODULE_OFF
    Given I am signed in as the ADMIN zz.admin.b@zz.test
    When I GET "/api/v1/library/titles?q=ZZ"
    Then the status is 403
    And the error code is "MODULE_OFF"

  @negative
  Scenario: Only the office admin settles a fine
    Given I am signed in as the LIBRARIAN
    When I POST "/api/v1/library/fines/czzlibfine00000000002/settle"
    Then the status is 403
