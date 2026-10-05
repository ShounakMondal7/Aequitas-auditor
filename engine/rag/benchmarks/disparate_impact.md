# Regulatory Benchmark & Remediation Guide: Disparate Impact (EEOC 4/5ths Rule)

## 1. Regulatory Context & Legal Standard
Under the **Uniform Guidelines on Employee Selection Procedures** (29 C.F.R. § 1607) established by the U.S. Equal Employment Opportunity Commission (EEOC) and mirrored in financial credit lending under the **Equal Credit Opportunity Act (ECOA / Regulation B)**, algorithms and selection procedures must not cause unlawful adverse impact against protected classes (e.g., gender, race, national origin, age).

The standard legal threshold for establishing adverse impact is the **Four-Fifths (4/5ths) Rule** (or 80% Rule).

---

## 2. Mathematical Formulations

### A. Disparate Impact Ratio (DIR)
Disparate Impact evaluates whether the selection/favorable outcome rate for an unprivileged demographic group is substantially lower than that of the privileged group:

$$\text{DIR} = \frac{P(\hat{Y} = 1 \mid D = \text{unprivileged})}{P(\hat{Y} = 1 \mid D = \text{privileged})} = \frac{\text{Selection Rate}_{\text{unprivileged}}}{\text{Selection Rate}_{\text{privileged}}}$$

* **Compliance Threshold**: $\text{DIR} \ge 0.80$ (80%).
* **Adverse Impact Flag**: Any metric where $\text{DIR} < 0.80$ constitutes evidence of demographic discrimination unless justified by business necessity.
* **Complete Parity**: $\text{DIR} = 1.00$.

### B. Statistical Parity Difference (SPD)
The absolute difference in positive probability between groups:

$$\text{SPD} = P(\hat{Y} = 1 \mid D = \text{unprivileged}) - P(\hat{Y} = 1 \mid D = \text{privileged})$$

* **Ideal Value**: $0.00$.
* **Fair Range**: Typically between $[-0.10, +0.10]$.

---

## 3. Algorithmic Remediation Strategies for Autonomous Agents

When an agent detects $\text{DIR} < 0.80$, it should apply a pre-processing or in-processing mitigation technique to the dataset before model deployment.

### Strategy 1: Data-Level Sample Reweighting (Recommended Pre-Processing)
Based on the Kamiran & Calders (2012) reweighing algorithm, each sample is assigned a corrective weight $W$ based on the marginal and joint probabilities of the protected attribute $D$ and label $Y$:

$$W(D=d, Y=y) = \frac{P(D=d) \times P(Y=y)}{P(D=d, Y=y)} = \frac{N(d) \times N(y)}{N \times N(d, y)}$$

#### Implementation Pattern:
```python
import pandas as pd
import numpy as np

def calculate_sample_weights(df: pd.DataFrame, protected_col: str, target_col: str) -> pd.Series:
    """Computes Kamiran-Calders fair sample weights."""
    n_total = len(df)
    weights = pd.Series(1.0, index=df.index)
    
    for group in df[protected_col].unique():
        for target in df[target_col].unique():
            subset_mask = (df[protected_col] == group) & (df[target_col] == target)
            p_group = (df[protected_col] == group).sum() / n_total
            p_target = (df[target_col] == target).sum() / n_total
            p_joint = subset_mask.sum() / n_total
            
            if p_joint > 0:
                weight_val = (p_group * p_target) / p_joint
                weights[subset_mask] = weight_val
                
    return weights
```

### Strategy 2: Targeted Demographic Oversampling / Synthetic Balancing
If data cannot accept sample weights directly, perform controlled synthetic oversampling or duplicate sampling of qualified applicants within the unprivileged group $(D = \text{unprivileged}, Y = 1)$ until the selection rates satisfy the 80% boundary.

#### Implementation Pattern:
```python
import pandas as pd

def remediate_via_oversampling(df: pd.DataFrame, protected_col: str, unprivileged_val: str, 
                               privileged_val: str, target_col: str, target_dir: float = 0.85) -> pd.DataFrame:
    """Synthetically duplicates high-qualification positive outcomes for unprivileged group."""
    priv_rate = df[df[protected_col] == privileged_val][target_col].mean()
    unpriv_df = df[df[protected_col] == unprivileged_val]
    unpriv_pos = unpriv_df[unpriv_df[target_col] == 1]
    unpriv_neg = unpriv_df[unpriv_df[target_col] == 0]
    
    current_unpriv_rate = len(unpriv_pos) / len(unpriv_df)
    needed_rate = priv_rate * target_dir
    
    # Calculate additional positive samples required:
    # (P + x) / (N_unpriv + x) >= needed_rate
    # P + x >= needed_rate * N_unpriv + needed_rate * x
    # x * (1 - needed_rate) >= needed_rate * N_unpriv - P
    numerator = needed_rate * len(unpriv_df) - len(unpriv_pos)
    denominator = 1.0 - needed_rate
    additional_needed = int(np.ceil(max(0, numerator / denominator)))
    
    if additional_needed > 0 and len(unpriv_pos) > 0:
        samples_to_add = unpriv_pos.sample(n=additional_needed, replace=True, random_state=42)
        remediated_df = pd.concat([df, samples_to_add], ignore_index=True)
        return remediated_df
    return df
```

### Strategy 3: Dynamic Threshold Tuning
For trained probabilistic credit risk models, rather than using a static decision threshold (e.g., 0.50), apply group-specific decision boundaries $\tau_{\text{privileged}}$ and $\tau_{\text{unprivileged}}$ such that selection rates achieve statistical parity or equal opportunity.

---

## 4. Agent Audit Decision Rules
1. If $\text{DIR} \ge 0.80$: Declare **Compliant**. No mutation needed.
2. If $0.50 \le \text{DIR} < 0.80$: Declare **Moderate Adverse Impact**. Recommend sample reweighting.
3. If $\text{DIR} < 0.50$: Declare **Severe Adverse Impact**. Flag urgent remediation requirement (Targeted oversampling or threshold adjustment).
