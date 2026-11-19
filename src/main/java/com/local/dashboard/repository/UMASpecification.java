package com.local.dashboard.repository;

import com.local.dashboard.dto.request.OscListFilterRequest;
import com.local.dashboard.entity.OneStepCloserEntity;
import com.local.dashboard.enumz.Status;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class UMASpecification {

    public static Specification<OneStepCloserEntity> filter(
            OscListFilterRequest request
    ) {

        return (root, query, cb) -> {

            Predicate predicate = cb.conjunction();

            if (request.getTitle() != null) {
                predicate = cb.and(
                        predicate,
                        cb.equal(
                                root.get("title"),
                                request.getTitle()
                        )
                );
            }

            if(request.getDescription() != null) {
                predicate = cb.and(
                  predicate,
                  cb.equal(root.get("description"), request.getDescription())
                );
            }

            if(request.getStatus() != null) {

                predicate = cb.and(
                        predicate,
                        cb.equal(root.get("status"), request.getStatus())
                );
            }
            return predicate;
        };
    }
}