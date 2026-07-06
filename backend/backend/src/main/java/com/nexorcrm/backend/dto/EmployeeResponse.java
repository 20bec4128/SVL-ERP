package com.nexorcrm.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import com.nexorcrm.backend.entity.EmployeeProfileStatus;

public class EmployeeResponse {
    private Long id;
    private String employeeCode;
    private String name;
    private String email;
    private BigDecimal basic;
    private BigDecimal da;
    private BigDecimal hra;
    private BigDecimal conveyance;
    private BigDecimal tds;
    private BigDecimal esi;
    private BigDecimal pf;
    private BigDecimal leaveDeduction;
    private BigDecimal netSalary;
    private Long headOfficeId;
    private Long branchId;
    private Long departmentMasterId;
    private Long designationMasterId;
    private String employeeIdNumber;
    private String countryCode;
    private String phone;
    private String dept;
    private String institution;
    private String departmentName;
    private String team;
    private String designation;
    private String fatherName;
    private String motherName;
    private String personalContactNumber;
    private String alternateContactNumber;
    private String location;
    private String pinCode;
    private String state;
    private String currentAddress;
    private String permanentAddress;
    private String personalEmail;
    private String officialEmail;
    private LocalDate dateOfBirth;
    private String maritalStatus;
    private String spouseName;
    private String bloodGroup;
    private String panCardNo;
    private String aadharCardNo;
    private String bankAccountHolderName;
    private String bankAccountNumber;
    private String ifscCode;
    private String bankAndBranch;
    private String employmentDetails1;
    private String employmentDetails2;
    private LocalDate previousEmploymentJoiningDate;
    private LocalDate previousEmploymentRelievingDate;
    private String previousEmploymentSalaryAtJoining;
    private String previousEmploymentSalaryAtRelieving;
    private String previousEmploymentRelievedWithNoticePeriod;
    private String previousEmploymentAbsconded;
    private String previousEmploymentDesignationAtJoining;
    private String previousEmploymentDesignationAtRelieving;
    private String previousEmploymentManagerName;
    private String previousEmploymentManagerMobileNumber;
    private String previousEmploymentCompanyAddress;
    private String graduationDetails;
    private String hscMarkAndYear;
    private String sslcMarkAndYear;
    private String educationQualification;
    private String educationCourseName;
    private String educationCertificateNumber;
    private String educationRollNumber;
    private String educationMark;
    private String educationMaxMark;
    private String educationMarkPercentage;
    private String educationFromYear;
    private String educationToYear;
    private String emergencyContactName1;
    private String emergencyContactRelation1;
    private String emergencyContactPhone1;
    private String emergencyContactName2;
    private String emergencyContactRelation2;
    private String emergencyContactPhone2;
    private String friendRefName1;
    private String friendRefContact1;
    private String friendRefName2;
    private String friendRefContact2;
    private String branchToJoin;
    private String platformSource;
    private String pfUan;
    private String esiNo;
    private LocalDate declarationDate;
    private String declarationPlace;
    private String candidatePhotoPath;
    private String aadharCardPath;
    private String panCardPath;
    private String bankPassbookPath;
    private String experienceCertificatePath;
    private String certificatePath;
    private String graduationCertificatePath;
    private String graduationMarksheetPath;
    private String hscMarksheetPath;
    private String sslcMarksheetPath;
    private String communityCertificatePath;
    private LocalDate joinDate;
    private String status;
    private EmployeeProfileStatus profileStatus;
    private String gender;
    private String img;
    private boolean offerLetterSent;
    private LocalDateTime offerLetterLinkExpiresAt;
    private List<Long> leavePolicyIds;
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

    public EmployeeProfileStatus getProfileStatus() {
        return profileStatus;
    }

    public void setProfileStatus(EmployeeProfileStatus profileStatus) {
        this.profileStatus = profileStatus;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public boolean isOfferLetterSent() {
        return offerLetterSent;
    }

    public void setOfferLetterSent(boolean offerLetterSent) {
        this.offerLetterSent = offerLetterSent;
    }

    public LocalDateTime getOfferLetterLinkExpiresAt() {
        return offerLetterLinkExpiresAt;
    }

    public void setOfferLetterLinkExpiresAt(LocalDateTime offerLetterLinkExpiresAt) {
        this.offerLetterLinkExpiresAt = offerLetterLinkExpiresAt;
    }

    public List<Long> getLeavePolicyIds() {
        return leavePolicyIds;
    }

    public void setLeavePolicyIds(List<Long> leavePolicyIds) {
        this.leavePolicyIds = leavePolicyIds;
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
    public String getFriendRefName1() { return friendRefName1; }
    public void setFriendRefName1(String friendRefName1) { this.friendRefName1 = friendRefName1; }
    public String getFriendRefContact1() { return friendRefContact1; }
    public void setFriendRefContact1(String friendRefContact1) { this.friendRefContact1 = friendRefContact1; }
    public String getFriendRefName2() { return friendRefName2; }
    public void setFriendRefName2(String friendRefName2) { this.friendRefName2 = friendRefName2; }
    public String getFriendRefContact2() { return friendRefContact2; }
    public void setFriendRefContact2(String friendRefContact2) { this.friendRefContact2 = friendRefContact2; }
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
}
