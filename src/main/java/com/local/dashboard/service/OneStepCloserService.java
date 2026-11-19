package com.local.dashboard.service;

import com.local.dashboard.dto.request.OSCCreateRequest;
import com.local.dashboard.dto.request.OSCDepositRequest;
import com.local.dashboard.dto.request.OscListFilterRequest;
import com.local.dashboard.dto.response.OscDepositResponse;
import com.local.dashboard.dto.response.OscResponse;
import com.local.dashboard.dto.response.PaginationResponseDto;
import com.local.dashboard.dto.response.ResponseBuilderUtils;
import com.local.dashboard.entity.OneStepCloserDepositHistory;
import com.local.dashboard.entity.OneStepCloserEntity;
import com.local.dashboard.enumz.Currency;
import com.local.dashboard.enumz.Status;
import com.local.dashboard.exception.SystemException;
import com.local.dashboard.repository.OneStepCloserDepositRepository;
import com.local.dashboard.repository.OneStepCloserRepository;
import com.local.dashboard.repository.UMASpecification;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@AllArgsConstructor
public class OneStepCloserService {

    private final OneStepCloserRepository oneStepCloserRepository;
    private final OneStepCloserDepositRepository oneStepCloserDepositRepository;

    public ResponseBuilderUtils<OscResponse> list(OscListFilterRequest request) {
        Sort sort = Sort.by(
                Sort.Direction.fromString(
                        request.getSortDirection()
                ),
                request.getSortBy()
        );

        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                sort
        );

        Page<OneStepCloserEntity> umaPage =
                oneStepCloserRepository.findAll(
                        UMASpecification.filter(request),
                        pageable
                );
        List<OscResponse> responses =
                umaPage.getContent()
                        .stream()
                        .map(milestone -> {
                            OscResponse response = new OscResponse();
                            response.setId(milestone.getId());
                            response.setStatus(milestone.getStatus());
                            response.setDescription(milestone.getDescription());
                            response.setTitle(milestone.getTitle());
                            response.setTargetAmount(milestone.getTargetAmount());
                            response.setCurrentAmount(milestone.getCurrentAmount());
                            response.setImageUrl(milestone.getImageUrl());
                            response.setCompletedDate(milestone.getCompletedDate());
                            response.setCreatedDate(milestone.getCreatedDate());
                            return response;
                        })
                        .toList();

        PaginationResponseDto<OscResponse> response =
                PaginationResponseDto
                        .<OscResponse>builder()
                        .contents(responses)
                        .page(umaPage.getNumber())
                        .size(umaPage.getSize())
                        .totalElements(umaPage.getTotalElements())
                        .totalPages(umaPage.getTotalPages())
                        .hasNext(umaPage.hasNext())
                        .hasPrevious(umaPage.hasPrevious())
                        .build();

        ResponseBuilderUtils<OscResponse> responseObj = new ResponseBuilderUtils<>(
                "200",
                "SUCCESS",
                response
        );

        return responseObj;
    }

    public void createNewOSC(OSCCreateRequest request) {
        OneStepCloserEntity newEntity = new OneStepCloserEntity();

        newEntity.setTitle(request.getTitle());
        newEntity.setCurrentAmount(BigDecimal.ZERO);
        newEntity.setTargetAmount(request.getTargetAmount());
        newEntity.setStatus(request.getStatus());
        newEntity.setDescription(Objects.isNull(request.getDescription()) ? "" : request.getDescription());
        newEntity.setImageUrl(Objects.isNull(request.getImageUrl()) ? "" : request.getImageUrl());
        newEntity.setCreatedDate(request.getCreatedDate());

        oneStepCloserRepository.save(newEntity);

    }

    public OscDepositResponse deposit(OSCDepositRequest request) {
        OscDepositResponse response = new OscDepositResponse();

        Optional<OneStepCloserEntity> osc = oneStepCloserRepository.findById(request.getOscId());

        var requestedAmount = request.getAmount();
        var requestedCurrency = request.getCurrency();

        if(osc.isPresent()) {
            OneStepCloserEntity oneStepCloserEntity = osc.get();

            BigDecimal updatedCurrentAmt = oneStepCloserEntity.getCurrentAmount().add(requestedAmount);

            if(updatedCurrentAmt.compareTo(oneStepCloserEntity.getTargetAmount()) > 0) {
                throw new SystemException("You cannot added more than your target amount");
            }

            OneStepCloserDepositHistory depositEntity = new OneStepCloserDepositHistory();
            depositEntity.setOscId(oneStepCloserEntity.getId());

            if(Currency.USDC.equals(requestedCurrency)) {
                depositEntity.setAmount(requestedAmount.multiply(BigDecimal.valueOf(100)));
            } else {
                depositEntity.setAmount(requestedAmount);
            }

            depositEntity.setDepositDate(LocalDateTime.now());
            oneStepCloserDepositRepository.save(depositEntity);

            response.setStatus(Status.IN_PROGRESS.name());
            if(updatedCurrentAmt.compareTo(oneStepCloserEntity.getTargetAmount()) >= 0) {
                oneStepCloserEntity.setStatus(Status.COMPLETED.name());
                oneStepCloserEntity.setCompletedDate(LocalDateTime.now());
                response.setStatus(Status.COMPLETED.name());
            }
            oneStepCloserEntity.setCurrentAmount(updatedCurrentAmt);
            oneStepCloserRepository.save(oneStepCloserEntity);

        } else {
            response.setResponse("Failed");
        }

        response.setResponse("SUCCESS");

        return response;
    }

}
