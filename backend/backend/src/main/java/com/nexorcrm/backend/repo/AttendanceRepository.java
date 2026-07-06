package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Attendance;
import com.nexorcrm.backend.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByUserIdAndAttendanceDateAndDeletedFalse(Long userId, LocalDate date);

    List<Attendance> findByUserIdAndAttendanceDateBetweenAndDeletedFalseOrderByAttendanceDateDesc(
            Long userId, LocalDate from, LocalDate to);

    List<Attendance> findByAttendanceDateAndDeletedFalseOrderByCheckInTimeDesc(LocalDate date);

    List<Attendance> findByAttendanceDateBetweenAndDeletedFalseOrderByAttendanceDateDescCheckInTimeDesc(
            LocalDate from, LocalDate to);

    @Query("SELECT a FROM Attendance a WHERE a.status IN :statuses AND a.deleted = false AND a.attendanceDate = :date")
    List<Attendance> findActiveByStatusesOnDate(@Param("statuses") List<AttendanceStatus> statuses,
                                                 @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.userId = :userId " +
           "AND a.attendanceDate BETWEEN :from AND :to AND a.deleted = false")
    long countByUserBetween(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(a.netWorkMinutes),0) FROM Attendance a WHERE a.userId = :userId " +
           "AND a.attendanceDate BETWEEN :from AND :to AND a.deleted = false")
    int sumNetWorkMinutesByUserBetween(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(a.overtimeMinutes),0) FROM Attendance a " +
           "WHERE a.userId = :userId AND a.attendanceDate BETWEEN :from AND :to " +
           "AND a.deleted = false")
    int sumOvertimeMinutesByUserBetween(@Param("userId") Long userId, 
        @Param("from") LocalDate from, @Param("to") LocalDate to);

    List<Attendance> findByStatusInAndDeletedFalseAndAttendanceDate(
            List<AttendanceStatus> statuses, LocalDate date);

    List<Attendance> findByIsMissedCheckoutTrueAndStatusNotInAndDeletedFalseAndAttendanceDate(
            List<AttendanceStatus> statuses, LocalDate date);
}

