package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", unique = true, length = 20)
    private String employeeCode; // EMP-001

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 120)
    private String email;

    @Column(length = 10)
    private String countryCode; // Phone country code (e.g., +91)

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String dept;

    @Column(length = 150)
    private String institution;

    @Column(name = "department_name", length = 150)
    private String departmentName;

    @Column(length = 100)
    private String team;

    @Column(length = 100)
    private String designation;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "department_master_id")
    private Long departmentMasterId;

    @Column(name = "designation_master_id")
    private Long designationMasterId;

    @Column(name = "employee_id_number", length = 50)
    private String employeeIdNumber;

    @Column(name = "father_name", length = 150)
    private String fatherName;

    @Column(name = "mother_name", length = 150)
    private String motherName;

    @Column(name = "personal_contact_number", length = 30)
    private String personalContactNumber;

    @Column(name = "alternate_contact_number", length = 30)
    private String alternateContactNumber;

    @Column(length = 150)
    private String location;

    @Column(name = "pin_code", length = 20)
    private String pinCode;

    @Column(length = 120)
    private String state;

    @Column(name = "current_address", columnDefinition = "TEXT")
    private String currentAddress;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "personal_email", length = 150)
    private String personalEmail;

    @Column(name = "official_email", length = 150)
    private String officialEmail;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "marital_status", length = 30)
    private String maritalStatus;

    @Column(name = "spouse_name", length = 150)
    private String spouseName;

    @Column(name = "blood_group", length = 20)
    private String bloodGroup;

    @Column(name = "pan_card_no", length = 30)
    private String panCardNo;

    @Column(name = "aadhar_card_no", length = 30)
    private String aadharCardNo;

    @Column(name = "bank_account_holder_name", length = 150)
    private String bankAccountHolderName;

    @Column(name = "bank_account_number", length = 60)
    private String bankAccountNumber;

    @Column(name = "ifsc_code", length = 30)
    private String ifscCode;

    @Column(name = "bank_and_branch", length = 200)
    private String bankAndBranch;

    @Column(name = "employment_details_1", columnDefinition = "TEXT")
    private String employmentDetails1;

    @Column(name = "employment_details_2", columnDefinition = "TEXT")
    private String employmentDetails2;

    @Column(name = "previous_employment_joining_date")
    private LocalDate previousEmploymentJoiningDate;

    @Column(name = "previous_employment_relieving_date")
    private LocalDate previousEmploymentRelievingDate;

    @Column(name = "previous_employment_salary_at_joining", length = 40)
    private String previousEmploymentSalaryAtJoining;

    @Column(name = "previous_employment_salary_at_relieving", length = 40)
    private String previousEmploymentSalaryAtRelieving;

    @Column(name = "previous_employment_relieved_with_notice_period", length = 20)
    private String previousEmploymentRelievedWithNoticePeriod;

    @Column(name = "previous_employment_absconded", length = 20)
    private String previousEmploymentAbsconded;

    @Column(name = "previous_employment_designation_at_joining", length = 150)
    private String previousEmploymentDesignationAtJoining;

    @Column(name = "previous_employment_designation_at_relieving", length = 150)
    private String previousEmploymentDesignationAtRelieving;

    @Column(name = "previous_employment_manager_name", length = 150)
    private String previousEmploymentManagerName;

    @Column(name = "previous_employment_manager_mobile_number", length = 30)
    private String previousEmploymentManagerMobileNumber;

    @Column(name = "previous_employment_company_address", columnDefinition = "TEXT")
    private String previousEmploymentCompanyAddress;

    @Column(name = "graduation_details", length = 50)
    private String graduationDetails;

    @Column(name = "hsc_mark_and_year", length = 80)
    private String hscMarkAndYear;

    @Column(name = "sslc_mark_and_year", length = 80)
    private String sslcMarkAndYear;

    @Column(name = "education_qualification", length = 30)
    private String educationQualification;

    @Column(name = "education_course_name", length = 150)
    private String educationCourseName;

    @Column(name = "education_certificate_number", length = 80)
    private String educationCertificateNumber;

    @Column(name = "education_roll_number", length = 80)
    private String educationRollNumber;

    @Column(name = "education_mark", length = 40)
    private String educationMark;

    @Column(name = "education_max_mark", length = 40)
    private String educationMaxMark;

    @Column(name = "education_mark_percentage", length = 20)
    private String educationMarkPercentage;

    @Column(name = "education_from_year", length = 10)
    private String educationFromYear;

    @Column(name = "education_to_year", length = 10)
    private String educationToYear;

    @Column(name = "friend_ref_name_1", length = 150)
    private String friendRefName1;

    @Column(name = "friend_ref_contact_1", length = 30)
    private String friendRefContact1;

    @Column(name = "friend_ref_name_2", length = 150)
    private String friendRefName2;

    @Column(name = "friend_ref_contact_2", length = 30)
    private String friendRefContact2;

    @Column(name = "emergency_contact_name_1", length = 150)
    private String emergencyContactName1;

    @Column(name = "emergency_contact_relation_1", length = 120)
    private String emergencyContactRelation1;

    @Column(name = "emergency_contact_phone_1", length = 30)
    private String emergencyContactPhone1;

    @Column(name = "emergency_contact_name_2", length = 150)
    private String emergencyContactName2;

    @Column(name = "emergency_contact_relation_2", length = 120)
    private String emergencyContactRelation2;

    @Column(name = "emergency_contact_phone_2", length = 30)
    private String emergencyContactPhone2;

    @Column(name = "branch_to_join", length = 150)
    private String branchToJoin;

    @Column(name = "platform_source", length = 150)
    private String platformSource;

    @Column(name = "pf_uan", length = 60)
    private String pfUan;

    @Column(name = "esi_no", length = 60)
    private String esiNo;

    @Column(name = "declaration_date")
    private LocalDate declarationDate;

    @Column(name = "declaration_place", length = 150)
    private String declarationPlace;

    @Column(name = "candidate_photo_path", length = 500)
    private String candidatePhotoPath;

    @Column(name = "aadhar_card_path", length = 500)
    private String aadharCardPath;

    @Column(name = "pan_card_path", length = 500)
    private String panCardPath;

    @Column(name = "bank_passbook_path", length = 500)
    private String bankPassbookPath;

    @Column(name = "experience_certificate_path", length = 500)
    private String experienceCertificatePath;

    @Column(name = "certificate_path", length = 500)
    private String certificatePath;

    @Column(name = "graduation_certificate_path", length = 500)
    private String graduationCertificatePath;

    @Column(name = "graduation_marksheet_path", length = 500)
    private String graduationMarksheetPath;

    @Column(name = "hsc_marksheet_path", length = 500)
    private String hscMarksheetPath;

    @Column(name = "sslc_marksheet_path", length = 500)
    private String sslcMarksheetPath;

    @Column(name = "community_certificate_path", length = 500)
    private String communityCertificatePath;

    @Column(precision = 15, scale = 2)
    private BigDecimal basic = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal da = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal hra = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal conveyance = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal tds = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal esi = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal pf = BigDecimal.ZERO;

    @Column(name = "leave_deduction", precision = 15, scale = 2)
    private BigDecimal leaveDeduction = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;

    private LocalDate joinDate;

    @Column(length = 20)
    private String status; // ACTIVE / INACTIVE

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_status", nullable = false, length = 30)
    private EmployeeProfileStatus profileStatus = EmployeeProfileStatus.DRAFT;

    @Column(name = "profile_status_updated_at")
    private LocalDateTime profileStatusUpdatedAt;

    @Column(length = 20)
    private String gender;

    @Column(length = 500)
    private String img;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public EmployeeProfileStatus getProfileStatus() {
        return profileStatus;
    }

    public void setProfileStatus(EmployeeProfileStatus profileStatus) {
        this.profileStatus = profileStatus;
    }

    public LocalDateTime getProfileStatusUpdatedAt() {
        return profileStatusUpdatedAt;
    }

    public void setProfileStatusUpdatedAt(LocalDateTime profileStatusUpdatedAt) {
        this.profileStatusUpdatedAt = profileStatusUpdatedAt;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEmployeeCode() {
		return employeeCode;
	}

	public void setEmployeeCode(String employeeCode) {
		this.employeeCode = employeeCode;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getCountryCode() {
		return countryCode;
	}

	public void setCountryCode(String countryCode) {
		this.countryCode = countryCode;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getDept() {
		return dept;
	}

	public void setDept(String dept) {
		this.dept = dept;
	}

	public String getInstitution() {
		return institution;
	}

	public void setInstitution(String institution) {
		this.institution = institution;
	}

	public String getDepartmentName() {
		return departmentName;
	}

	public void setDepartmentName(String departmentName) {
		this.departmentName = departmentName;
	}

	public String getTeam() {
		return team;
	}

	public void setTeam(String team) {
		this.team = team;
	}

    public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public Long getDepartmentMasterId() { return departmentMasterId; }
    public void setDepartmentMasterId(Long departmentMasterId) { this.departmentMasterId = departmentMasterId; }

    public Long getDesignationMasterId() { return designationMasterId; }
    public void setDesignationMasterId(Long designationMasterId) { this.designationMasterId = designationMasterId; }

    public String getEmployeeIdNumber() { return employeeIdNumber; }
    public void setEmployeeIdNumber(String employeeIdNumber) { this.employeeIdNumber = employeeIdNumber; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getPersonalContactNumber() { return personalContactNumber; }
    public void setPersonalContactNumber(String personalContactNumber) { this.personalContactNumber = personalContactNumber; }

    public String getAlternateContactNumber() { return alternateContactNumber; }
    public void setAlternateContactNumber(String alternateContactNumber) { this.alternateContactNumber = alternateContactNumber; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCurrentAddress() { return currentAddress; }
    public void setCurrentAddress(String currentAddress) { this.currentAddress = currentAddress; }

    public String getPermanentAddress() { return permanentAddress; }
    public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }

    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }

    public String getOfficialEmail() { return officialEmail; }
    public void setOfficialEmail(String officialEmail) { this.officialEmail = officialEmail; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getSpouseName() { return spouseName; }
    public void setSpouseName(String spouseName) { this.spouseName = spouseName; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getPanCardNo() { return panCardNo; }
    public void setPanCardNo(String panCardNo) { this.panCardNo = panCardNo; }

    public String getAadharCardNo() { return aadharCardNo; }
    public void setAadharCardNo(String aadharCardNo) { this.aadharCardNo = aadharCardNo; }

    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBankAndBranch() { return bankAndBranch; }
    public void setBankAndBranch(String bankAndBranch) { this.bankAndBranch = bankAndBranch; }

    public String getEmploymentDetails1() { return employmentDetails1; }
    public void setEmploymentDetails1(String employmentDetails1) { this.employmentDetails1 = employmentDetails1; }

    public String getEmploymentDetails2() { return employmentDetails2; }
    public void setEmploymentDetails2(String employmentDetails2) { this.employmentDetails2 = employmentDetails2; }

    public LocalDate getPreviousEmploymentJoiningDate() { return previousEmploymentJoiningDate; }
    public void setPreviousEmploymentJoiningDate(LocalDate previousEmploymentJoiningDate) { this.previousEmploymentJoiningDate = previousEmploymentJoiningDate; }

    public LocalDate getPreviousEmploymentRelievingDate() { return previousEmploymentRelievingDate; }
    public void setPreviousEmploymentRelievingDate(LocalDate previousEmploymentRelievingDate) { this.previousEmploymentRelievingDate = previousEmploymentRelievingDate; }

    public String getPreviousEmploymentSalaryAtJoining() { return previousEmploymentSalaryAtJoining; }
    public void setPreviousEmploymentSalaryAtJoining(String previousEmploymentSalaryAtJoining) { this.previousEmploymentSalaryAtJoining = previousEmploymentSalaryAtJoining; }

    public String getPreviousEmploymentSalaryAtRelieving() { return previousEmploymentSalaryAtRelieving; }
    public void setPreviousEmploymentSalaryAtRelieving(String previousEmploymentSalaryAtRelieving) { this.previousEmploymentSalaryAtRelieving = previousEmploymentSalaryAtRelieving; }

    public String getPreviousEmploymentRelievedWithNoticePeriod() { return previousEmploymentRelievedWithNoticePeriod; }
    public void setPreviousEmploymentRelievedWithNoticePeriod(String previousEmploymentRelievedWithNoticePeriod) { this.previousEmploymentRelievedWithNoticePeriod = previousEmploymentRelievedWithNoticePeriod; }

    public String getPreviousEmploymentAbsconded() { return previousEmploymentAbsconded; }
    public void setPreviousEmploymentAbsconded(String previousEmploymentAbsconded) { this.previousEmploymentAbsconded = previousEmploymentAbsconded; }

    public String getPreviousEmploymentDesignationAtJoining() { return previousEmploymentDesignationAtJoining; }
    public void setPreviousEmploymentDesignationAtJoining(String previousEmploymentDesignationAtJoining) { this.previousEmploymentDesignationAtJoining = previousEmploymentDesignationAtJoining; }

    public String getPreviousEmploymentDesignationAtRelieving() { return previousEmploymentDesignationAtRelieving; }
    public void setPreviousEmploymentDesignationAtRelieving(String previousEmploymentDesignationAtRelieving) { this.previousEmploymentDesignationAtRelieving = previousEmploymentDesignationAtRelieving; }

    public String getPreviousEmploymentManagerName() { return previousEmploymentManagerName; }
    public void setPreviousEmploymentManagerName(String previousEmploymentManagerName) { this.previousEmploymentManagerName = previousEmploymentManagerName; }

    public String getPreviousEmploymentManagerMobileNumber() { return previousEmploymentManagerMobileNumber; }
    public void setPreviousEmploymentManagerMobileNumber(String previousEmploymentManagerMobileNumber) { this.previousEmploymentManagerMobileNumber = previousEmploymentManagerMobileNumber; }

    public String getPreviousEmploymentCompanyAddress() { return previousEmploymentCompanyAddress; }
    public void setPreviousEmploymentCompanyAddress(String previousEmploymentCompanyAddress) { this.previousEmploymentCompanyAddress = previousEmploymentCompanyAddress; }

    public String getGraduationDetails() { return graduationDetails; }
    public void setGraduationDetails(String graduationDetails) { this.graduationDetails = graduationDetails; }

    public String getHscMarkAndYear() { return hscMarkAndYear; }
    public void setHscMarkAndYear(String hscMarkAndYear) { this.hscMarkAndYear = hscMarkAndYear; }

    public String getSslcMarkAndYear() { return sslcMarkAndYear; }
    public void setSslcMarkAndYear(String sslcMarkAndYear) { this.sslcMarkAndYear = sslcMarkAndYear; }

    public String getEducationQualification() { return educationQualification; }
    public void setEducationQualification(String educationQualification) { this.educationQualification = educationQualification; }

    public String getEducationCourseName() { return educationCourseName; }
    public void setEducationCourseName(String educationCourseName) { this.educationCourseName = educationCourseName; }

    public String getEducationCertificateNumber() { return educationCertificateNumber; }
    public void setEducationCertificateNumber(String educationCertificateNumber) { this.educationCertificateNumber = educationCertificateNumber; }

    public String getEducationRollNumber() { return educationRollNumber; }
    public void setEducationRollNumber(String educationRollNumber) { this.educationRollNumber = educationRollNumber; }

    public String getEducationMark() { return educationMark; }
    public void setEducationMark(String educationMark) { this.educationMark = educationMark; }

    public String getEducationMaxMark() { return educationMaxMark; }
    public void setEducationMaxMark(String educationMaxMark) { this.educationMaxMark = educationMaxMark; }

    public String getEducationMarkPercentage() { return educationMarkPercentage; }
    public void setEducationMarkPercentage(String educationMarkPercentage) { this.educationMarkPercentage = educationMarkPercentage; }

    public String getEducationFromYear() { return educationFromYear; }
    public void setEducationFromYear(String educationFromYear) { this.educationFromYear = educationFromYear; }

    public String getEducationToYear() { return educationToYear; }
    public void setEducationToYear(String educationToYear) { this.educationToYear = educationToYear; }

    public String getFriendRefName1() { return friendRefName1; }
    public void setFriendRefName1(String friendRefName1) { this.friendRefName1 = friendRefName1; }

    public String getFriendRefContact1() { return friendRefContact1; }
    public void setFriendRefContact1(String friendRefContact1) { this.friendRefContact1 = friendRefContact1; }

    public String getFriendRefName2() { return friendRefName2; }
    public void setFriendRefName2(String friendRefName2) { this.friendRefName2 = friendRefName2; }

    public String getFriendRefContact2() { return friendRefContact2; }
    public void setFriendRefContact2(String friendRefContact2) { this.friendRefContact2 = friendRefContact2; }

    public String getEmergencyContactName1() { return emergencyContactName1; }
    public void setEmergencyContactName1(String emergencyContactName1) { this.emergencyContactName1 = emergencyContactName1; }

    public String getEmergencyContactRelation1() { return emergencyContactRelation1; }
    public void setEmergencyContactRelation1(String emergencyContactRelation1) { this.emergencyContactRelation1 = emergencyContactRelation1; }

    public String getEmergencyContactPhone1() { return emergencyContactPhone1; }
    public void setEmergencyContactPhone1(String emergencyContactPhone1) { this.emergencyContactPhone1 = emergencyContactPhone1; }

    public String getEmergencyContactName2() { return emergencyContactName2; }
    public void setEmergencyContactName2(String emergencyContactName2) { this.emergencyContactName2 = emergencyContactName2; }

    public String getEmergencyContactRelation2() { return emergencyContactRelation2; }
    public void setEmergencyContactRelation2(String emergencyContactRelation2) { this.emergencyContactRelation2 = emergencyContactRelation2; }

    public String getEmergencyContactPhone2() { return emergencyContactPhone2; }
    public void setEmergencyContactPhone2(String emergencyContactPhone2) { this.emergencyContactPhone2 = emergencyContactPhone2; }

    public String getBranchToJoin() { return branchToJoin; }
    public void setBranchToJoin(String branchToJoin) { this.branchToJoin = branchToJoin; }

    public String getPlatformSource() { return platformSource; }
    public void setPlatformSource(String platformSource) { this.platformSource = platformSource; }

    public String getPfUan() { return pfUan; }
    public void setPfUan(String pfUan) { this.pfUan = pfUan; }

    public String getEsiNo() { return esiNo; }
    public void setEsiNo(String esiNo) { this.esiNo = esiNo; }

    public LocalDate getDeclarationDate() { return declarationDate; }
    public void setDeclarationDate(LocalDate declarationDate) { this.declarationDate = declarationDate; }

    public String getDeclarationPlace() { return declarationPlace; }
    public void setDeclarationPlace(String declarationPlace) { this.declarationPlace = declarationPlace; }

    public String getCandidatePhotoPath() { return candidatePhotoPath; }
    public void setCandidatePhotoPath(String candidatePhotoPath) { this.candidatePhotoPath = candidatePhotoPath; }

    public String getAadharCardPath() { return aadharCardPath; }
    public void setAadharCardPath(String aadharCardPath) { this.aadharCardPath = aadharCardPath; }

    public String getPanCardPath() { return panCardPath; }
    public void setPanCardPath(String panCardPath) { this.panCardPath = panCardPath; }

    public String getBankPassbookPath() { return bankPassbookPath; }
    public void setBankPassbookPath(String bankPassbookPath) { this.bankPassbookPath = bankPassbookPath; }

    public String getExperienceCertificatePath() { return experienceCertificatePath; }
    public void setExperienceCertificatePath(String experienceCertificatePath) { this.experienceCertificatePath = experienceCertificatePath; }

    public String getCertificatePath() { return certificatePath; }
    public void setCertificatePath(String certificatePath) { this.certificatePath = certificatePath; }

    public String getGraduationCertificatePath() { return graduationCertificatePath; }
    public void setGraduationCertificatePath(String graduationCertificatePath) { this.graduationCertificatePath = graduationCertificatePath; }

    public String getGraduationMarksheetPath() { return graduationMarksheetPath; }
    public void setGraduationMarksheetPath(String graduationMarksheetPath) { this.graduationMarksheetPath = graduationMarksheetPath; }

    public String getHscMarksheetPath() { return hscMarksheetPath; }
    public void setHscMarksheetPath(String hscMarksheetPath) { this.hscMarksheetPath = hscMarksheetPath; }

    public String getSslcMarksheetPath() { return sslcMarksheetPath; }
    public void setSslcMarksheetPath(String sslcMarksheetPath) { this.sslcMarksheetPath = sslcMarksheetPath; }

    public String getCommunityCertificatePath() { return communityCertificatePath; }
    public void setCommunityCertificatePath(String communityCertificatePath) { this.communityCertificatePath = communityCertificatePath; }

	public LocalDate getJoinDate() {
		return joinDate;
	}

	public void setJoinDate(LocalDate joinDate) {
		this.joinDate = joinDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getImg() {
		return img;
	}

	public void setImg(String img) {
		this.img = img;
	}

	public Boolean getDeleted() {
		return deleted;
	}

	public void setDeleted(Boolean deleted) {
		this.deleted = deleted;
	}

    public BigDecimal getBasic() { return basic; }
    public void setBasic(BigDecimal basic) { this.basic = basic; }

    public BigDecimal getDa() { return da; }
    public void setDa(BigDecimal da) { this.da = da; }

    public BigDecimal getHra() { return hra; }
    public void setHra(BigDecimal hra) { this.hra = hra; }

    public BigDecimal getConveyance() { return conveyance; }
    public void setConveyance(BigDecimal conveyance) { this.conveyance = conveyance; }

    public BigDecimal getTds() { return tds; }
    public void setTds(BigDecimal tds) { this.tds = tds; }

    public BigDecimal getEsi() { return esi; }
    public void setEsi(BigDecimal esi) { this.esi = esi; }

    public BigDecimal getPf() { return pf; }
    public void setPf(BigDecimal pf) { this.pf = pf; }

    public BigDecimal getLeaveDeduction() { return leaveDeduction; }
    public void setLeaveDeduction(BigDecimal leaveDeduction) { this.leaveDeduction = leaveDeduction; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	@Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null || status.isBlank()) status = "ACTIVE";
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // getters/setters
    // (generate in IDE)
}
