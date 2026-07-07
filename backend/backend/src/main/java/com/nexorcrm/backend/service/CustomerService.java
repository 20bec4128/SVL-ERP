package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.Customer;
import com.nexorcrm.backend.entity.Invoice;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.Quotation;
import com.nexorcrm.backend.entity.SalesOrder;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.repo.CustomerRepository;
import com.nexorcrm.backend.repo.InvoiceRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.QuotationRepository;
import com.nexorcrm.backend.repo.SalesOrderRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final QuotationRepository quotationRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            InvoiceRepository invoiceRepository,
            QuotationRepository quotationRepository,
            SalesOrderRepository salesOrderRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
        this.quotationRepository = quotationRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Customer convertLeadToCustomer(Long leadId) {
        // Prevent duplicate conversion
        Optional<Customer> existingOpt = customerRepository.findBySourceLeadId(leadId);
        if (existingOpt.isPresent()) {
            return existingOpt.get();
        }

        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + leadId));

        // Generate Unique Customer ID: CUST-YYYYMM-TIMESTAMP
        String yearMonth = LocalDate.now().toString().replace("-", "").substring(0, 6);
        String uniqueId = "CUST-" + yearMonth + "-" + (System.currentTimeMillis() % 10000);

        Customer customer = new Customer();
        customer.setCustomerId(uniqueId);
        customer.setCompanyName(lead.getCompanyName() != null ? lead.getCompanyName() : lead.getName());
        customer.setContactPerson(lead.getName());
        customer.setEmailAddress(lead.getEmail());
        customer.setMobileNumber(lead.getMobile());
        customer.setGstNumber(lead.getGstin());
        customer.setBillingAddress(lead.getStreetAddress());
        customer.setShippingAddress(lead.getStreetAddress());
        customer.setBusinessType(lead.getLeadType());
        customer.setSalesExecutiveId(lead.getOwnerUserId());
        customer.setSourceLeadId(lead.getId());
        
        // Default terms
        customer.setPaymentTerms("50% Advance, 50% Before Delivery");
        customer.setCreditLimit(BigDecimal.ZERO);

        Customer savedCustomer = customerRepository.save(customer);

        // Update Lead Status to "Converted to Customer"
        lead.setStatus("Converted to Customer");
        leadRepository.save(lead);

        // Fetch accepted quotation to build the first invoice
        List<Quotation> quotations = quotationRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        Quotation acceptedQt = quotations.stream()
                .filter(q -> "QUOTATION_ACCEPTED".equalsIgnoreCase(q.getStatus()) || "APPROVED".equalsIgnoreCase(q.getStatus()))
                .findFirst()
                .orElse(quotations.isEmpty() ? null : quotations.get(0));

        SalesOrder so = salesOrderRepository.findByLeadId(leadId).stream().findFirst().orElse(null);

        // Generate Invoice
        Invoice invoice = new Invoice();
        String invoiceNum = "INV-" + yearMonth + "-" + (System.currentTimeMillis() % 10000);
        invoice.setInvoiceNumber(invoiceNum);
        invoice.setCustomerId(savedCustomer.getId());
        invoice.setLeadId(leadId);
        invoice.setIssueDate(LocalDate.now());
        if (so != null) {
            invoice.setSalesOrderId(so.getId());
        }

        if (acceptedQt != null) {
            BigDecimal sub = acceptedQt.getSubtotal() != null ? acceptedQt.getSubtotal() : BigDecimal.ZERO;
            BigDecimal grand = acceptedQt.getGrandTotal() != null ? acceptedQt.getGrandTotal() : BigDecimal.ZERO;
            invoice.setSubtotal(sub);
            invoice.setGstAmount(grand.subtract(sub));
            invoice.setGrandTotal(grand);
            invoice.setRemainingAmount(grand);
            invoice.setPaymentTerms(customer.getPaymentTerms());
            invoice.setDueDate(LocalDate.now().plusDays(15)); // default net 15
        } else {
            invoice.setSubtotal(BigDecimal.ZERO);
            invoice.setGstAmount(BigDecimal.ZERO);
            invoice.setGrandTotal(BigDecimal.ZERO);
            invoice.setRemainingAmount(BigDecimal.ZERO);
        }

        invoice.setStatus("Draft");
        invoiceRepository.save(invoice);

        // Auto-provision or activate Customer Portal Account
        if (savedCustomer.getEmailAddress() != null && !savedCustomer.getEmailAddress().isBlank()) {
            Optional<User> existingUser = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(savedCustomer.getEmailAddress());
            if (!existingUser.isPresent()) {
                User user = new User();
                user.setUsername(savedCustomer.getEmailAddress());
                user.setEmail(savedCustomer.getEmailAddress());
                user.setFirstName(savedCustomer.getContactPerson());
                user.setRole(Role.CUSTOMER);
                user.setActivationStatus(ActivationStatus.ACTIVE);
                user.setActive(true);
                user.setPasswordHash(passwordEncoder.encode("Customer@123"));
                userRepository.save(user);
            } else {
                User user = existingUser.get();
                if (user.getRole() == Role.CUSTOMER) {
                    user.setActive(true);
                    user.setActivationStatus(ActivationStatus.ACTIVE);
                    userRepository.save(user);
                }
            }
        }

        return savedCustomer;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }
}
