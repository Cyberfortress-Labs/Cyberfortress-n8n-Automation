**SmartXDR – IOC Analysis Report**

**Case ID:** {{CASE_ID}}
**Generated At:** {{DATE_NOW}}

---

# 1. Overview

This report summarizes IOC analysis results collected from SmartXDR, IntelOwl, and IRIS. 
Only IOCs with valid analysis are included in the analytical section.

- **Total IOCs:** {{TOTAL_IOCS}}
- **IOCs with SmartXDR analysis:** {{COUNT_WITH_ANALYSIS}}
- **IOCs without SmartXDR analysis:** {{COUNT_WITHOUT_ANALYSIS}}

---

# 2. IOCs Summary Table

| IOC Type | IOC Value | Has AI Analysis? |
|---------|-----------|------------------|
{{IOC_TABLE_ROWS}}

---

# 3. Detailed SmartXDR Analysis

{{DETAILED_ANALYSIS_SECTION}}

---

# 4. IOCs Without Analysis

{{NO_ANALYSIS_SECTION}}

---

# 5. Suggested Next Steps

1. Validate findings in IRIS for cross-reference.  
2. Check network logs (pfSense, Suricata, Zeek) for connections related to suspicious IOC values.  
3. Apply containment actions if any IOC is confirmed malicious (firewall block, EDR isolation, etc.).  
4. Update the IRIS case with decisions made by the SOC analyst.

---

**Prepared by SmartXDR Automated Pipeline**