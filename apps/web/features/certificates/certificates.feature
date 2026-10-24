@web @mobile @needs-server
Feature: Certificates
  The office issues certificates from templates, with serials under a year lock and a public check by the
  printed code; a family asks for one and reads what was issued to their child; a revoked paper says so.

  @happy
  Scenario: A guardian reads their child's certificate and its PDF
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/certificates"
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "items" has "studentName" equal to "ZZ Aarav Apte"
    When I remember the "id" of the first item of "items" as "certificate"
    And I GET "/api/v1/shared/certificates/{{certificate}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "code" is present
    And the field "revokedAt" equals null
    When I GET "/api/v1/shared/certificates/{{certificate}}/pdf"
    Then the status is 200
    And the content type contains "application/pdf"

  @happy
  Scenario: Anyone can check a printed code, and the check names no pupil
    Given I am signed in as the PARENT
    When I GET "/api/v1/family/certificates"
    And I remember the "id" of the first item of "items" as "certificate"
    And I GET "/api/v1/shared/certificates/{{certificate}}"
    And I remember the field "code" as "code"
    Given I am signed out
    When I GET "/api/v1/public/certificates/{{code}}"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "valid" equals true
    And the field "schoolName" equals "ZZ Northgate School"
    And the answer does not contain "Aarav"

  @alternative
  Scenario: The office's list holds issued and revoked papers, each revoked after it was issued
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/certificates"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "revokedAt" present
    And every item of "items" with "revokedAt" present has it no earlier than its "issuedAt"

  @alternative
  Scenario: The office's templates and the waiting requests
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/certificate-templates"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "templates" is a list of at least 1 item
    When I GET "/api/v1/office/certificate-requests"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "items" has "status" equal to "PENDING"

  @negative
  Scenario: An unknown code is answered "not valid", not an error
    Given I am signed out
    When I GET "/api/v1/public/certificates/NOPE000000"
    Then the status is 200
    And the field "valid" equals false

  @negative
  Scenario: A guardian cannot open another family's certificate
    Given I am signed in as the ADMIN
    When I GET "/api/v1/office/certificates"
    And I remember the "id" of the first item of "items" whose "studentName" equals "ZZ Chetan Chavan" as "other"
    Given I am signed in as the PARENT
    When I GET "/api/v1/shared/certificates/{{other}}"
    Then the status is one of 403, 404
    And the answer does not contain "Chetan"

  @negative
  Scenario: A teacher cannot issue a certificate
    Given I am signed in as the TEACHER
    When I POST "/api/v1/office/certificates" with:
      """
      {}
      """
    Then the status is 403

  @negative
  Scenario: A request with no kind and no purpose is refused for its shape
    Given I am signed in as the PARENT
    When I POST "/api/v1/family/certificate-requests" with:
      """
      {}
      """
    Then the status is 422
