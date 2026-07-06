package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.AccountingCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountingCategoryRepository extends JpaRepository<AccountingCategory, Long> {
    List<AccountingCategory> findByDeletedFalseOrderByIdDesc();

    boolean existsByNameIgnoreCaseAndSubNameIgnoreCaseAndDeletedFalse(String name, String subName);

    boolean existsByNameIgnoreCaseAndSubNameIgnoreCaseAndDeletedFalseAndIdNot(
            String name,
            String subName,
            Long id
    );
}
