package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    // Find all addresses for a lead, ordered by is_primary desc then by created_at desc
    @Query("SELECT a FROM Address a WHERE a.leadId = :leadId AND a.isDeleted = false ORDER BY a.isPrimary DESC, a.createdAt DESC")
    List<Address> findByLeadIdAndDeletedFalse(@Param("leadId") Long leadId);

    // Find addresses by lead and type
    @Query("SELECT a FROM Address a WHERE a.leadId = :leadId AND a.type = :type AND a.isDeleted = false ORDER BY a.isPrimary DESC, a.createdAt DESC")
    List<Address> findByLeadIdAndTypeAndDeletedFalse(@Param("leadId") Long leadId, @Param("type") String type);

    // Find by ID and check soft delete
    @Query("SELECT a FROM Address a WHERE a.id = :id AND a.isDeleted = false")
    Optional<Address> findByIdAndDeletedFalse(@Param("id") Long id);

    // Find primary address for lead and type
    @Query("SELECT a FROM Address a WHERE a.leadId = :leadId AND a.type = :type AND a.isPrimary = true AND a.isDeleted = false")
    Optional<Address> findPrimaryAddressByLeadAndType(@Param("leadId") Long leadId, @Param("type") String type);

    // Check if address exists for lead
    @Query("SELECT COUNT(a) > 0 FROM Address a WHERE a.leadId = :leadId AND a.isDeleted = false")
    boolean existsByLeadIdAndDeletedFalse(@Param("leadId") Long leadId);
}
