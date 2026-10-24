@web @mobile @needs-server
Feature: Sign-in and roles
  A session is a person and the role and school they chose; every request re-checks it against the live
  membership. The scenarios use minted sessions (npm run zz:token), never a password typed into a form.

  @happy
  Scenario: The office admin's session names their school, role and modules
    Given I am signed in as the ADMIN
    When I GET "/api/v1/me"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "user.email" equals "zz.admin@zz.test"
    And the field "active.role" equals "ADMIN"
    And the field "institutionKind" equals "SCHOOL"
    And some item of "contexts" has "schoolName" equal to "ZZ Northgate School"

  @happy
  Scenario: A guardian's session carries no school of its own
    Given I am signed in as the PARENT
    When I GET "/api/v1/me"
    Then the status is 200
    And the field "active.role" equals "PARENT"
    And the field "active.schoolId" equals null
    And the field "active.membershipId" equals null

  @alternative
  Scenario: A college role's session names the college and its kind
    Given I am signed in as the FACULTY
    When I GET "/api/v1/me"
    Then the status is 200
    And the field "active.role" equals "FACULTY"
    And the field "institutionKind" does not equal "SCHOOL"
    And the field "modules" is a list of at least 1 item

  @alternative
  Scenario: The operator signs in with no school and no role
    Given I am signed in as the OPERATOR
    When I GET "/api/v1/me"
    Then the status is 200
    And the field "user.isSuperuser" equals true
    And the field "active.role" equals null

  @negative
  Scenario: Signed out, the person's own door answers 401
    Given I am signed out
    When I GET "/api/v1/me"
    Then the status is 401
    And the error code is "UNAUTHORIZED"

  @negative
  Scenario: A sign-in with no identifier and no password is refused for its shape
    Given I am signed out
    When I POST "/api/v1/auth/login" with:
      """
      {}
      """
    Then the status is 422
    And the field "issues.identifier" is present
    And the field "issues.password" is present

  @negative
  Scenario: A teacher cannot switch their session to a role they do not hold
    Given I am signed in as the TEACHER
    When I GET "/api/v1/me"
    And I remember the field "active.schoolId" as "school"
    And I POST "/api/v1/me/context" with:
      """
      { "schoolId": "{{school}}", "role": "ADMIN" }
      """
    Then the status is 403
    And the error code is "FORBIDDEN"

  @negative
  Scenario: A guardian cannot point their session at a school
    # A school id sent with PARENT is not trusted (session.ts): the switch is answered with no school chosen.
    Given I am signed in as the PARENT
    When I POST "/api/v1/me/context" with:
      """
      { "schoolId": "not-a-school-of-mine", "role": "PARENT" }
      """
    Then the status is 200
    And the field "active.role" equals "PARENT"
    And the field "active.schoolId" equals null

  @negative
  Scenario: A student is refused the office's fee overview
    Given I am signed in as the STUDENT
    When I GET "/api/v1/fees/overview"
    Then the status is 403
    And the error code is "FORBIDDEN"

  @negative
  Scenario: A limited role reaches only the doors that name it
    Given I am signed in as the DRIVER
    When I GET "/api/v1/shared/bulletin"
    Then the status is 403

  @negative
  Scenario: A replayed request naming another person is not signed in
    Given I am signed in as the TEACHER
    And the next request carries the header "X-Edulink-Owner" set to "somebody-else"
    When I GET "/api/v1/me"
    Then the status is 401

  @happy
  Scenario: A person sees their own sessions, the current one marked
    Given I am signed in as the ADMIN
    When I GET "/api/v1/me/sessions"
    Then the status is 200
    And the answer matches the catalog contract
