package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PriceListEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PriceListEntryRepository extends JpaRepository<PriceListEntry, Long> {
    @Query(
            value = """
                select *
                from price_list_entry p
                where (:categoryId is null or p.category_id = :categoryId)
                  and (:typeId is null or p.type_id = :typeId)
                  and (:subtypeId is null or p.subtype_id = :subtypeId)
                  and (
                    :search is null
                    or p.type_name ilike concat('%', cast(:search as text), '%')
                    or p.subtype_name ilike concat('%', cast(:search as text), '%')
                  )
                """,
            countQuery = """
                select count(*)
                from price_list_entry p
                where (:categoryId is null or p.category_id = :categoryId)
                  and (:typeId is null or p.type_id = :typeId)
                  and (:subtypeId is null or p.subtype_id = :subtypeId)
                  and (
                    :search is null
                    or p.type_name ilike concat('%', cast(:search as text), '%')
                    or p.subtype_name ilike concat('%', cast(:search as text), '%')
                  )
                """,
            nativeQuery = true
    )
    Page<PriceListEntry> findAllFiltered(
            @Param("categoryId") Long categoryId,
            @Param("typeId") Long typeId,
            @Param("subtypeId") Long subtypeId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            select
              p.type_id as id,
              max(coalesce(p.type_name, '')) as name,
              count(*) as total_count
            from price_list_entry p
            where (:categoryId is null or p.category_id = :categoryId)
            group by p.type_id
            order by max(coalesce(p.type_name, '')) asc, p.type_id asc
            """, nativeQuery = true)
    java.util.List<PriceListCountProjection> countTypesByCategory(@Param("categoryId") Long categoryId);

    @Query(value = """
            select
              p.subtype_id as id,
              max(coalesce(p.subtype_name, '')) as name,
              count(*) as total_count
            from price_list_entry p
            where p.type_id = :typeId
              and p.subtype_id is not null
            group by p.subtype_id
            order by max(coalesce(p.subtype_name, '')) asc, p.subtype_id asc
            """, nativeQuery = true)
    java.util.List<PriceListCountProjection> countSubtypesByType(@Param("typeId") Long typeId);
}
