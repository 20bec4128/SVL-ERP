package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmployeeDocument;
import com.nexorcrm.backend.entity.EmployeeDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {
    List<EmployeeDocument> findByEmployeeId(Long employeeId);
    List<EmployeeDocument> findByEmployeeIdAndDocType(Long employeeId, EmployeeDocumentType docType);
    Optional<EmployeeDocument> findFirstByEmployeeIdAndDocTypeOrderByUploadedAtDesc(Long employeeId, EmployeeDocumentType docType);
}

