package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerId(String customerId);
    Optional<Customer> findBySourceLeadId(Long sourceLeadId);
    Optional<Customer> findByEmailAddress(String emailAddress);
}
