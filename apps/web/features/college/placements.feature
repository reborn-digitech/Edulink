@web @mobile @needs-server
Feature: Placements
  The training and placement officer (TPO) runs drives on computed eligibility (CGPA, live backlogs,
  attendance, programme, batch); a student sees the drives open to them; an outside recruiter reads their own
  company's drives at the colleges that invited them. Fixture drive czzpldrive00000000002 at ZZ Vidya College.

  @happy
  Scenario: The TPO's drives, each with its applicants and offers
    Given I am signed in as the TPO
    When I GET "/api/v1/placement/drives"
    Then the status is 200
    And the answer matches the catalog contract
    And some item of "drives" has "id" equal to "czzpldrive00000000002"
    And every item of "drives" has "offers" no more than its "applicants"

  @happy
  Scenario: A drive's eligibility is counted from its rows
    Given I am signed in as the TPO
    When I GET "/api/v1/placement/drives/czzpldrive00000000002/eligibility"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "total" equals the number of items of "rows"
    And the field "eligible" equals the number of items of "rows" whose "eligible" equals true
    And every item of "rows" whose "eligible" is false names a failed rule

  @happy
  Scenario: A student sees their placement record and the drives open to them
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/student/placement"
    Then the status is 200
    And the answer matches the catalog contract
    And the field "record.cgpa" is present
    And the field "drives" is a list of at least 1 item

  @alternative
  Scenario: The batch on the student's page is the college's placement season, not the student's own batch
    # studentPlacement() answers settings.seasonBatchYear as `batchYear`; the student's own batch is record.batchYear.
    Given I am signed in as the TPO
    When I GET "/api/v1/placement/settings"
    And I remember the field "seasonBatchYear" as "season"
    Given I am signed in as the STUDENT zz.cstudent01@zz.test
    When I GET "/api/v1/student/placement"
    Then the field "batchYear" equals {{season}}

  @alternative
  Scenario: A recruiter reads their own company's drives
    Given I am signed in as the RECRUITER
    When I GET "/api/v1/recruiter/me"
    Then the status is 200
    And the field "companyName" equals "ZZ Zeta Analytics"
    When I GET "/api/v1/recruiter/drives"
    Then the status is 200
    And the answer matches the catalog contract
    And every item of "drives" has "collegeName" present

  @negative
  Scenario: A recruiter cannot read the TPO's desk
    Given I am signed in as the RECRUITER
    When I GET "/api/v1/placement/drives"
    Then the status is 403

  @negative
  Scenario: A faculty member cannot read the drives
    Given I am signed in as the FACULTY
    When I GET "/api/v1/placement/drives"
    Then the status is 403

  @negative
  Scenario: A drive with no company and no title is refused for its shape
    Given I am signed in as the TPO
    When I POST "/api/v1/placement/drives" with:
      """
      {}
      """
    Then the status is 422
