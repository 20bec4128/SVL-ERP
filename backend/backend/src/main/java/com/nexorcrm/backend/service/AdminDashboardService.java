package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.AdminDashboardResponse;
import com.nexorcrm.backend.dto.DashboardBirthdayGroupResponse;
import com.nexorcrm.backend.dto.DashboardBirthdayItemResponse;
import com.nexorcrm.backend.dto.DashboardActivityResponse;
import com.nexorcrm.backend.dto.DashboardBreadcrumbResponse;
import com.nexorcrm.backend.dto.DashboardHeaderResponse;
import com.nexorcrm.backend.dto.DashboardEmployeeResponse;
import com.nexorcrm.backend.dto.DashboardStatResponse;
import com.nexorcrm.backend.dto.DashboardWelcomeResponse;
import com.nexorcrm.backend.dto.AttendanceOverviewResponse;
import com.nexorcrm.backend.dto.ClockInOutItem;
import com.nexorcrm.backend.entity.Attendance;
import com.nexorcrm.backend.entity.AttendanceStatus;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.Leave;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.AttendanceRepository;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.HeadOfficeMasterRepository;
import com.nexorcrm.backend.repo.LeaveRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.MonthDay;
import java.time.temporal.ChronoUnit;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Locale;

@Service
public class AdminDashboardService {

    private final SuperAdminService superAdminService;
    private final UserRepository userRepository;
    private final HeadOfficeMasterRepository headOfficeRepository;
    private final BranchMasterRepository branchRepository;
    private final DepartmentMasterRepository departmentRepository;
    private final DesignationMasterRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;

    public AdminDashboardService(SuperAdminService superAdminService,
                                 UserRepository userRepository,
                                 HeadOfficeMasterRepository headOfficeRepository,
                                 BranchMasterRepository branchRepository,
                                 DepartmentMasterRepository departmentRepository,
                                 DesignationMasterRepository designationRepository,
                                 EmployeeRepository employeeRepository,
                                 AttendanceRepository attendanceRepository,
                                 LeaveRepository leaveRepository) {
        this.superAdminService = superAdminService;
        this.userRepository = userRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.branchRepository = branchRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRepository = leaveRepository;
    }

    public AdminDashboardResponse getDashboard(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);

        long visibleUsers = superAdminService.getVisibleUsers(PageRequest.of(0, 1), actorPrincipal).getTotalElements();
        long pendingUsers = superAdminService.getPendingUsers(PageRequest.of(0, 1), actorPrincipal).getTotalElements();
        long activeUsers = countActiveUsers(actor);
        long employees = countEmployees(actor);
        long attendanceToday = countTodayAttendance();
        long pendingLeaves = countPendingLeaves();
        long headOffices = headOfficeRepository.findByDeletedFalseOrderByIdDesc().size();
        long branches = branchRepository.findByDeletedFalseOrderByIdDesc().size();
        long departments = departmentRepository.findByDeletedFalseOrderByIdDesc().size();
        long designations = designationRepository.findByDeletedFalseOrderByIdDesc().size();

        AdminDashboardResponse response = new AdminDashboardResponse();
        response.setHeader(buildHeader());
        response.setWelcome(buildWelcome(actor, pendingUsers, pendingLeaves));
        response.setTopStats(buildTopStats(
                headOffices,
                branches,
                departments,
                designations,
                employees,
                activeUsers,
                pendingUsers,
                attendanceToday
        ));
        response.setRecentActivities(buildRecentActivities(actorPrincipal));
        
        response.setAttendanceOverview(buildAttendanceOverview(actor));
        response.setClockInOutList(buildClockInOutList(actor));
        response.setLateList(buildLateList(response.getClockInOutList()));
        response.setEmployees(buildEmployeeHighlights(actor));
        response.setBirthdays(buildBirthdayGroups(actor));
        
        return response;
    }

    private DashboardHeaderResponse buildHeader() {
        DashboardHeaderResponse header = new DashboardHeaderResponse();
        header.setTitle("Admin Dashboard");

        List<DashboardBreadcrumbResponse> breadcrumbs = new ArrayList<>();
        breadcrumbs.add(breadcrumb("/admin-dashboard", "ti ti-smart-home", "Home"));
        breadcrumbs.add(breadcrumb(null, null, "Dashboard"));
        breadcrumbs.add(breadcrumb(null, null, "Admin Dashboard"));
        header.setBreadcrumbs(breadcrumbs);
        return header;
    }

    private DashboardWelcomeResponse buildWelcome(User actor, long pendingUsers, long pendingLeaves) {
        DashboardWelcomeResponse welcome = new DashboardWelcomeResponse();
        welcome.setName(resolveDisplayName(actor));
        welcome.setPendingApprovals(pendingUsers);
        welcome.setLeaveRequests(pendingLeaves);
        String avatarUrl = resolveAvatarUrl(actor);
        welcome.setAvatar(StringUtils.hasText(avatarUrl) ? avatarUrl : "assets/img/profiles/avatar-31.jpg");
        return welcome;
    }

    private List<DashboardStatResponse> buildTopStats(long headOffices,
                                                      long branches,
                                                      long departments,
                                                      long designations,
                                                      long employees,
                                                      long activeUsers,
                                                      long pendingUsers,
                                                      long attendanceToday) {
        List<DashboardStatResponse> stats = new ArrayList<>();
        stats.add(stat(1L, "bg-primary", "ti ti-building-skyscraper fs-16", "Head Offices", headOffices, "text-success", "fa-solid fa-caret-up me-1", "Live", "head-offices", "View All"));
        stats.add(stat(2L, "bg-secondary", "ti ti-building-community fs-16", "Branches", branches, "text-success", "fa-solid fa-caret-up me-1", "Live", "branches", "View All"));
        stats.add(stat(3L, "bg-info", "ti ti-layout-grid fs-16", "Departments", departments, "text-success", "fa-solid fa-caret-up me-1", "Live", "departments", "View All"));
        stats.add(stat(4L, "bg-pink", "ti ti-id-badge-2 fs-16", "Designations", designations, "text-success", "fa-solid fa-caret-up me-1", "Live", "designations", "View All"));
        stats.add(stat(5L, "bg-purple", "ti ti-users-group fs-16", "Employees", employees, "text-success", "fa-solid fa-caret-up me-1", "Live", "employees", "View All"));
        stats.add(stat(6L, "bg-danger", "ti ti-user-check fs-16", "Active Users", activeUsers, "text-success", "fa-solid fa-caret-up me-1", "Live", "useradmin", "View All"));
        stats.add(stat(7L, "bg-success", "ti ti-user-exclamation fs-16", "Pending Users", pendingUsers, "text-warning", "fa-solid fa-caret-right me-1", "Queued", "useradmin", "Review"));
        stats.add(stat(8L, "bg-dark", "ti ti-calendar-check fs-16", "Attendance Today", attendanceToday, "text-success", "fa-solid fa-caret-up me-1", "Live", "attendance-admin", "View All"));
        return stats;
    }

    private List<DashboardActivityResponse> buildRecentActivities(String actorPrincipal) {
        var page = superAdminService.getAuditLogsForActor(PageRequest.of(0, 5), actorPrincipal);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
        List<DashboardActivityResponse> items = new ArrayList<>();
        page.getContent().forEach(log -> {
            DashboardActivityResponse activity = new DashboardActivityResponse();
            activity.setId(log.getId());
            activity.setAction(log.getAction());
            activity.setPerformedBy(log.getPerformedBy());
            activity.setTargetUser(log.getTargetUser());
            activity.setDescription(log.getDescription());
            activity.setDisplayText(buildActivityText(log.getAction(), log.getDescription(), log.getTargetUser()));
            LocalDateTime createdAt = log.getCreatedAt();
            activity.setCreatedAt(createdAt);
            activity.setTimeLabel(createdAt == null ? "" : formatter.format(createdAt));
            items.add(activity);
        });
        return items;
    }

    private long countActiveUsers(User actor) {
        return userRepository.findByIsDeletedFalse().stream()
                .filter(User::isActive)
                .filter(user -> user.getActivationStatus() == null || user.getActivationStatus().name().equals("ACTIVE"))
                .filter(user -> matchesScope(actor, user.getInstitutionName(), user.getDepartmentName(), user.getTeamName()))
                .count();
    }

    private long countEmployees(User actor) {
        return employeeRepository.findByDeletedFalseOrderByIdDesc().stream()
                .filter(employee -> matchesScope(actor, employee.getInstitution(), employee.getDepartmentName(), employee.getTeam()))
                .count();
    }

    private long countTodayAttendance() {
        LocalDate today = LocalDate.now();
        return attendanceRepository.findByAttendanceDateAndDeletedFalseOrderByCheckInTimeDesc(today).size();
    }

    private long countPendingLeaves() {
        return leaveRepository.findByDeletedFalseOrderByFromDateDesc().stream()
                .filter(leave -> "NEW".equalsIgnoreCase(leave.getStatus()))
                .count();
    }

    private boolean matchesScope(User actor, String institution, String department, String team) {
        if (actor == null || actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.ADMIN) {
            return textEquals(actor.getInstitutionName(), institution);
        }
        if (actor.getRole() == Role.MANAGER) {
            return textEquals(actor.getInstitutionName(), institution)
                    && textEquals(actor.getDepartmentName(), department);
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            return textEquals(actor.getInstitutionName(), institution)
                    && textEquals(actor.getDepartmentName(), department)
                    && textEquals(actor.getTeamName(), team);
        }
        return true;
    }

    private DashboardBreadcrumbResponse breadcrumb(String href, String iconClass, String label) {
        DashboardBreadcrumbResponse breadcrumb = new DashboardBreadcrumbResponse();
        breadcrumb.setHref(href);
        breadcrumb.setIconClass(iconClass);
        breadcrumb.setLabel(label);
        return breadcrumb;
    }

    private DashboardStatResponse stat(Long id,
                                       String iconBg,
                                       String icon,
                                       String title,
                                       long value,
                                       String trendClass,
                                       String trendIcon,
                                       String trend,
                                       String link,
                                       String linkLabel) {
        DashboardStatResponse stat = new DashboardStatResponse();
        stat.setId(id);
        stat.setIconBg(iconBg);
        stat.setIcon(icon);
        stat.setTitle(title);
        stat.setValue(String.valueOf(value));
        stat.setTrendClass(trendClass);
        stat.setTrendIcon(trendIcon);
        stat.setTrend(trend);
        stat.setLink(link);
        stat.setLinkLabel(linkLabel);
        return stat;
    }

    private String resolveDisplayName(User actor) {
        if (actor == null) {
            return "Admin";
        }
        String firstName = trimToNull(actor.getFirstName());
        String lastName = trimToNull(actor.getLastName());
        if (StringUtils.hasText(firstName) || StringUtils.hasText(lastName)) {
            return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        }
        if (StringUtils.hasText(actor.getUsername())) {
            return actor.getUsername();
        }
        return "Admin";
    }

    private String resolveAvatarUrl(User actor) {
        if (actor == null || !StringUtils.hasText(actor.getProfilePhotoPath())) {
            return null;
        }
        String pathStr = actor.getProfilePhotoPath().replace("\\", "/");
        int uploadsIdx = pathStr.indexOf("uploads/");
        if (uploadsIdx >= 0) {
            return "/api/" + pathStr.substring(uploadsIdx);
        }
        return "/api/uploads/profile-photos/" + Path.of(actor.getProfilePhotoPath()).getFileName();
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new EntityNotFoundException("Actor not found");
        }
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private boolean textEquals(String left, String right) {
        return trimToNull(left) != null
                && trimToNull(left).equalsIgnoreCase(trimToNull(right) == null ? "" : trimToNull(right));
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String buildActivityText(String action, String description, String targetUser) {
        String normalizedAction = StringUtils.hasText(action)
                ? action.replace('_', ' ').toLowerCase(Locale.ROOT)
                : "event";
        String prettyAction = Character.toUpperCase(normalizedAction.charAt(0)) + normalizedAction.substring(1);
        String detail = StringUtils.hasText(description) ? description.trim() : StringUtils.hasText(targetUser) ? targetUser.trim() : "";
        return StringUtils.hasText(detail) ? prettyAction + " - " + detail : prettyAction;
    }

    private List<User> getScopeUsers(User actor) {
        return userRepository.findByIsDeletedFalse().stream()
                .filter(User::isActive)
                .filter(u -> u.getActivationStatus() == null || u.getActivationStatus().name().equals("ACTIVE"))
                .filter(u -> matchesScope(actor, u.getInstitutionName(), u.getDepartmentName(), u.getTeamName()))
                .collect(Collectors.toList());
    }

    private AttendanceOverviewResponse buildAttendanceOverview(User actor) {
        LocalDate today = LocalDate.now();
        List<User> users = getScopeUsers(actor);
        int totalEmployees = users.size();

        List<Attendance> todayAttendances = attendanceRepository.findByAttendanceDateAndDeletedFalseOrderByCheckInTimeDesc(today);
        List<Leave> activeLeaves = leaveRepository.findByDeletedFalseOrderByFromDateDesc().stream()
                .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
                .filter(l -> !today.isBefore(l.getFromDate()) && !today.isAfter(l.getToDate()))
                .collect(Collectors.toList());

        int presentCount = 0;
        int lateCount = 0;
        int permissionCount = 0;
        int absentCount = 0;
        List<AttendanceOverviewResponse.AbsenteeDto> absentees = new ArrayList<>();

        for (User user : users) {
            Optional<Attendance> attOpt = todayAttendances.stream()
                    .filter(a -> a.getUserId().equals(user.getId()))
                    .findFirst();
            if (attOpt.isPresent()) {
                Attendance att = attOpt.get();
                if (Boolean.TRUE.equals(att.getIsLate())) {
                    lateCount++;
                } else {
                    presentCount++;
                }
            } else {
                boolean hasLeave = activeLeaves.stream()
                        .anyMatch(l -> (user.getEmployeeId() != null && user.getEmployeeId().equals(l.getEmployeeId()))
                                || user.getEmail().equalsIgnoreCase(l.getEmployeeName())
                        );
                if (hasLeave) {
                    permissionCount++;
                } else {
                    absentCount++;
                    String name = resolveDisplayName(user);
                    String avatar = resolveAvatarUrl(user);
                    if (avatar == null || avatar.isEmpty()) {
                        avatar = "/assets/img/profiles/avatar-31.jpg";
                    }
                    absentees.add(new AttendanceOverviewResponse.AbsenteeDto(name, avatar));
                }
            }
        }

        double presentPercentage = totalEmployees > 0 ? (presentCount * 100.0 / totalEmployees) : 0.0;
        double latePercentage = totalEmployees > 0 ? (lateCount * 100.0 / totalEmployees) : 0.0;
        double permissionPercentage = totalEmployees > 0 ? (permissionCount * 100.0 / totalEmployees) : 0.0;
        double absentPercentage = totalEmployees > 0 ? (absentCount * 100.0 / totalEmployees) : 0.0;

        presentPercentage = Math.round(presentPercentage * 10) / 10.0;
        latePercentage = Math.round(latePercentage * 10) / 10.0;
        permissionPercentage = Math.round(permissionPercentage * 10) / 10.0;
        absentPercentage = Math.round(absentPercentage * 10) / 10.0;

        AttendanceOverviewResponse overview = new AttendanceOverviewResponse();
        overview.setTotalCount(presentCount + lateCount + permissionCount);
        overview.setPresentPercentage(presentPercentage);
        overview.setLatePercentage(latePercentage);
        overview.setPermissionPercentage(permissionPercentage);
        overview.setAbsentPercentage(absentPercentage);
        overview.setAbsentees(absentees);
        return overview;
    }

    private List<ClockInOutItem> buildClockInOutList(User actor) {
        LocalDate today = LocalDate.now();
        List<User> users = getScopeUsers(actor);
        List<Attendance> todayAttendances = attendanceRepository.findByAttendanceDateAndDeletedFalseOrderByCheckInTimeDesc(today);

        List<ClockInOutItem> items = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

        for (Attendance att : todayAttendances) {
            Optional<User> userOpt = users.stream()
                    .filter(u -> u.getId().equals(att.getUserId()))
                    .findFirst();
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                ClockInOutItem item = new ClockInOutItem();
                item.setEmployeeName(resolveDisplayName(user));
                
                String designation = "Employee";
                if (user.getEmployeeId() != null) {
                    Optional<Employee> empOpt = employeeRepository.findById(user.getEmployeeId());
                    if (empOpt.isPresent()) {
                        designation = empOpt.get().getDesignation();
                    }
                }
                item.setDesignation(designation != null && !designation.isEmpty() ? designation : "Employee");

                String avatar = resolveAvatarUrl(user);
                item.setAvatar(avatar != null && !avatar.isEmpty() ? avatar : "/assets/img/profiles/avatar-31.jpg");
                item.setStatus(att.getStatus() != null ? att.getStatus().name() : "CHECKED_IN");
                item.setCheckInTime(att.getCheckInTime() != null ? timeFormatter.format(att.getCheckInTime()) : "");
                item.setCheckOutTime(att.getCheckOutTime() != null ? timeFormatter.format(att.getCheckOutTime()) : "");
                
                Integer netMinutes = att.getNetWorkMinutes() != null ? att.getNetWorkMinutes() : 0;
                item.setProductionHours(String.format("%02d:%02d Hrs", netMinutes / 60, netMinutes % 60));
                
                item.setLate(Boolean.TRUE.equals(att.getIsLate()));
                item.setLateMinutes(att.getLateMinutes() != null ? att.getLateMinutes() : 0);
                items.add(item);
            }
        }
        return items;
    }

    private List<ClockInOutItem> buildLateList(List<ClockInOutItem> allItems) {
        List<ClockInOutItem> lateItems = new ArrayList<>();
        for (ClockInOutItem item : allItems) {
            if (item.isLate()) {
                lateItems.add(item);
            }
        }
        return lateItems;
    }

    private List<DashboardEmployeeResponse> buildEmployeeHighlights(User actor) {
        return employeeRepository.findByDeletedFalseOrderByIdDesc().stream()
                .filter(employee -> matchesScope(actor, employee.getInstitution(), employee.getDepartmentName(), employee.getTeam()))
                .limit(5)
                .map(employee -> {
                    DashboardEmployeeResponse item = new DashboardEmployeeResponse();
                    item.setEmployeeId(employee.getId());
                    item.setEmployeeName(resolveEmployeeDisplayName(employee));
                    item.setDesignation(resolveEmployeeDesignation(employee));
                    item.setDepartmentName(resolveEmployeeDepartment(employee));
                    item.setAvatar(resolveEmployeeAvatarUrl(employee));
                    return item;
                })
                .collect(Collectors.toList());
    }

    private List<DashboardBirthdayGroupResponse> buildBirthdayGroups(User actor) {
        LocalDate today = LocalDate.now();
        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

        Map<String, DashboardBirthdayGroupResponse> groups = new LinkedHashMap<>();
        employeeRepository.findByDeletedFalseOrderByIdDesc().stream()
                .filter(employee -> matchesScope(actor, employee.getInstitution(), employee.getDepartmentName(), employee.getTeam()))
                .filter(employee -> employee.getDateOfBirth() != null)
                .map(employee -> new BirthdayCandidate(employee, nextBirthday(employee.getDateOfBirth(), today)))
                .sorted(Comparator.comparing(candidate -> candidate.nextBirthday))
                .forEach(candidate -> {
                    String label = formatBirthdayLabel(candidate.nextBirthday, today, labelFormatter);
                    DashboardBirthdayGroupResponse group = groups.computeIfAbsent(label, key -> {
                        DashboardBirthdayGroupResponse response = new DashboardBirthdayGroupResponse();
                        response.setLabel(key);
                        response.setItems(new ArrayList<>());
                        return response;
                    });

                    DashboardBirthdayItemResponse item = new DashboardBirthdayItemResponse();
                    item.setEmployeeId(candidate.employee.getId());
                    item.setEmployeeName(resolveEmployeeDisplayName(candidate.employee));
                    item.setDesignation(resolveEmployeeDesignation(candidate.employee));
                    item.setAvatar(resolveEmployeeAvatarUrl(candidate.employee));
                    group.getItems().add(item);
                });

        return groups.values().stream()
                .limit(4)
                .collect(Collectors.toList());
    }

    private LocalDate nextBirthday(LocalDate dateOfBirth, LocalDate today) {
        MonthDay monthDay = MonthDay.from(dateOfBirth);
        LocalDate nextBirthday = monthDay.atYear(today.getYear());
        if (nextBirthday.isBefore(today)) {
            nextBirthday = monthDay.atYear(today.getYear() + 1);
        }
        return nextBirthday;
    }

    private String formatBirthdayLabel(LocalDate birthday, LocalDate today, DateTimeFormatter labelFormatter) {
        long daysUntil = ChronoUnit.DAYS.between(today, birthday);
        if (daysUntil == 0) {
            return "Today";
        }
        if (daysUntil == 1) {
            return "Tomorrow";
        }
        return labelFormatter.format(birthday);
    }

    private String resolveEmployeeDisplayName(Employee employee) {
        if (employee == null || !StringUtils.hasText(employee.getName())) {
            return "Employee";
        }
        return employee.getName().trim();
    }

    private String resolveEmployeeDesignation(Employee employee) {
        if (employee == null) {
            return "Employee";
        }
        if (StringUtils.hasText(employee.getDesignation())) {
            return employee.getDesignation().trim();
        }
        if (StringUtils.hasText(employee.getTeam())) {
            return employee.getTeam().trim();
        }
        return "Employee";
    }

    private String resolveEmployeeDepartment(Employee employee) {
        if (employee == null) {
            return "Department";
        }
        if (StringUtils.hasText(employee.getDepartmentName())) {
            return employee.getDepartmentName().trim();
        }
        if (StringUtils.hasText(employee.getDept())) {
            return employee.getDept().trim();
        }
        return "Department";
    }

    private String resolveEmployeeAvatarUrl(Employee employee) {
        if (employee == null || !StringUtils.hasText(employee.getCandidatePhotoPath())) {
            return "/assets/img/profiles/avatar-31.jpg";
        }
        String pathStr = employee.getCandidatePhotoPath().replace("\\", "/");
        int uploadsIdx = pathStr.indexOf("uploads/");
        if (uploadsIdx >= 0) {
            return "/api/" + pathStr.substring(uploadsIdx);
        }
        return "/api/employees/" + employee.getId() + "/files/candidate-photo";
    }

    private static final class BirthdayCandidate {
        private final Employee employee;
        private final LocalDate nextBirthday;

        private BirthdayCandidate(Employee employee, LocalDate nextBirthday) {
            this.employee = employee;
            this.nextBirthday = nextBirthday;
        }
    }
}
