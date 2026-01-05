# GurmeScore: Business Rules and Algorithm Documentation

## Table of Contents
1. [Overview](#overview)
2. [Business Rules](#business-rules)
3. [GurmeScore Calculation Algorithm](#gurmescore-calculation-algorithm)
4. [Weighting Mechanism](#weighting-mechanism)
5. [Similarity and Window Analysis](#similarity-and-window-analysis)
6. [Manipulation-Resistant Strategies](#manipulation-resistant-strategies)
7. [Cold Start Management](#cold-start-management)
8. [Minimum Vote Requirements](#minimum-vote-requirements)
9. [Ranking Logic](#ranking-logic)
10. [Gourmet Scores on Top Algorithm](#gourmet-scores-on-top-algorithm)
11. [Formulas and Examples](#formulas-and-examples)

---

## Overview

**GurmeScore** is an advanced rating system used on the flavor atlas platform to evaluate restaurant and food quality. This system goes beyond simple average ratings by considering factors such as user reliability, vote diversity, and manipulation resistance.

### Core Objectives
- **Fair Scoring**: Equal evaluation opportunity for all establishments
- **Quality Focus**: Reflecting genuine gourmet experiences
- **Manipulation Resistance**: Protection against fake votes and malicious behavior
- **Expert Opinion Priority**: Greater weight to experienced gourmets' opinions

---

## Business Rules

### 1. User Categories

Users are categorized based on activity levels and reliability:

- **Gourmet User**: 50+ reviews, high consistency, diverse venues
- **Active User**: 20-49 reviews, medium-level experience
- **Regular User**: 5-19 reviews
- **New User**: 0-4 reviews

### 2. Evaluation Criteria

Each review includes the following dimensions:
- **Taste Score** (0-10): Food flavor quality
- **Presentation Score** (0-10): Visual presentation
- **Service Score** (0-10): Service quality
- **Price/Performance** (0-10): Value perception
- **Ambiance** (0-10): Venue atmosphere

### 3. Data Integrity Rules

- Each user can only review an establishment once
- Reviews cannot be withdrawn but can be edited
- Edit history is maintained by the system
- Suspicious activities are automatically flagged

---

## GurmeScore Calculation Algorithm

GurmeScore uses a multi-factor weighting system. The basic formula:

```
GurmeScore = (ΣW × Bayesian_Weighted_Average) × Quality_Multiplier × Confidence_Factor
```

### Step-by-Step Calculation

#### 1. Raw Average Calculation
```
Raw_Average = Σ(Score_i) / n
```
Where:
- `Score_i`: Score given by the i-th user
- `n`: Total number of votes

#### 2. Bayesian Weighted Average
```
Bayesian_Score = (C × m + Σ(Score_i)) / (C + n)
```
Where:
- `C`: Confidence coefficient (default: 25 votes)
- `m`: Platform-wide average score (default: 7.0)
- `n`: Total votes received by the establishment

This formula solves the cold start problem by balancing abnormally high/low scores for establishments with few votes.

#### 3. User Weighting
Each user's vote is weighted according to reliability level:

```
Weighted_Score = Σ(Score_i × User_Weight_i) / Σ(User_Weight_i)
```

**User Weight Values:**
- Gourmet User: 3.0
- Active User: 2.0
- Regular User: 1.5
- New User: 1.0

#### 4. Final GurmeScore Calculation
```
GurmeScore = (0.6 × Weighted_Score + 0.4 × Bayesian_Score) × Quality_Multiplier × Confidence_Factor
```

---

## Weighting Mechanism

### User Reliability Score

A user's reliability score is calculated with these factors:

```
Reliability_Score = (Activity_Score × 0.4) + (Consistency_Score × 0.3) + (Diversity_Score × 0.2) + (Tenure_Score × 0.1)
```

#### Activity Score
```
Activity_Score = min(Review_Count / 100, 1.0)
```

#### Consistency Score
```
Consistency_Score = 1 - (Std_Deviation / 10)
```
- Lower standard deviation of user's scores indicates higher consistency

#### Diversity Score
```
Diversity_Score = min(Unique_Venue_Count / 50, 1.0)
```
- Evaluating different types and locations of establishments

#### Tenure Score
```
Tenure_Score = min(Membership_Days / 365, 1.0)
```

---

## Similarity and Window Analysis

### Time Window Weighting

Recent reviews receive more weight:

```
Time_Weight = e^(-λ × Day_Difference)
```
Where:
- `λ`: Time decay coefficient (default: 0.002)
- `Day_Difference`: Days elapsed from review date to today

**Examples:**
- 0 days: Weight = 1.00 (full weight)
- 180 days: Weight = 0.70
- 365 days: Weight = 0.49
- 730 days: Weight = 0.24

### Similarity Analysis

To detect suspicious vote clustering:

```
Similarity_Score = 1 / (1 + Σ|Score_i - Score_j| / n²)
```

If many similar scores arrive within a time window (e.g., 7 days) (Similarity_Score > 0.95), these votes are automatically flagged and their weights reduced:

```
Adjusted_Weight = Original_Weight × (1 - Similarity_Score × 0.5)
```

---

## Manipulation-Resistant Strategies

### 1. Sudden Score Change Detection

```
Change_Rate = |New_Average - Old_Average| / Old_Average
```

If `Change_Rate > 0.15` (15% change) occurs within a week:
- New votes are quarantined
- Manual review is initiated
- Temporarily more weight given to Bayesian average

### 2. IP and Device Analysis

Multiple reviews from the same IP or device:
- Automatically flagged
- Only the first review receives full weight
- Subsequent reviews calculated with 0.2 weight

### 3. Review Timing Analysis

Many reviews in a short period (e.g., 10+ reviews within 1 hour):
```
Timing_Penalty = max(0.3, 1 - (Votes_Per_Hour / 5))
```

### 4. Extreme Outlier Filtering

Statistical outlier detection:
```
Outlier = |Score - Median| > 2 × IQR
```
Where `IQR` (Interquartile Range): 3rd quartile - 1st quartile

Outliers:
- Calculated with 0.5 weight
- Full weight retained if from gourmet users

---

## Cold Start Management

Special strategies for new establishments:

### 1. Bootstrap Period (0-10 Votes)

```
Bootstrap_Score = (Actual_Average × 0.3) + (Platform_Average × 0.7)
```

This approach prevents establishments from getting extremely high or low scores with first few votes.

### 2. Accelerated Confidence Gain

Initial votes from gourmet users receive more weight:
```
Bootstrap_Weight = Normal_Weight × 1.5
```

### 3. Gradual Transition (11-25 Votes)

```
Transition_Factor = (Vote_Count - 10) / 15
Final_Score = (Bootstrap_Score × (1 - Transition_Factor)) + (Normal_Score × Transition_Factor)
```

### 4. Maturity State (25+ Votes)

From this point, the normal GurmeScore calculation algorithm fully activates.

---

## Minimum Vote Requirements

### Visibility Thresholds

Minimum requirements for establishments to appear in lists:

| List Type | Minimum Votes | Minimum GurmeScore | Additional Requirement |
|-----------|--------------|-------------------|----------------------|
| General List | 3 votes | 5.0 | - |
| Recommended | 10 votes | 7.5 | 2+ Gourmet votes |
| Best Of | 25 votes | 8.5 | 5+ Gourmet votes |
| Premium | 50 votes | 9.0 | 10+ Gourmet votes |

### Confidence Level

```
Confidence_Level = min(Vote_Count / 100, 1.0) × Gourmet_Vote_Ratio
```

Where:
- `Gourmet_Vote_Ratio = Gourmet_Votes / Total_Votes`

**Confidence Level Categories:**
- High: > 0.7 (Green badge)
- Medium: 0.4-0.7 (Yellow badge)
- Low: < 0.4 (Gray badge)

---

## Ranking Logic

Establishments are divided into ranks based on their GurmeScore:

### Rank Categories

```
Rank = f(GurmeScore, Vote_Count, Gourmet_Vote_Ratio)
```

#### 1. Elite Gourmet (🌟🌟🌟)
- GurmeScore ≥ 9.0
- Minimum 50 votes
- Gourmet vote ratio ≥ 20%
- Confidence level: High

#### 2. Superior Quality (🌟🌟)
- GurmeScore: 8.0-8.9
- Minimum 25 votes
- Gourmet vote ratio ≥ 15%
- Confidence level: Medium-High

#### 3. Quality (🌟)
- GurmeScore: 7.0-7.9
- Minimum 10 votes
- Gourmet vote ratio ≥ 10%

#### 4. Good
- GurmeScore: 6.0-6.9
- Minimum 5 votes

#### 5. Average
- GurmeScore: 5.0-5.9
- Minimum 3 votes

#### 6. Awaiting Review
- Vote count < 3

### Rank Promotion Conditions

To advance to the next rank:
```
Promotion_Score = (GurmeScore - Current_Rank_Lower_Bound) / (Upper_Rank_Lower_Bound - Current_Rank_Lower_Bound)
```

Promotion occurs if:
- `Promotion_Score ≥ 0.8` (80% of rank achieved)
- Minimum vote condition met
- At least 5 new reviews in the last 30 days

---

## Gourmet Scores on Top Algorithm

This algorithm moves establishments evaluated by experienced gourmets to the top of lists.

### Gourmet Boost Factor

```
Gourmet_Boost = 1 + (Gourmet_Vote_Ratio × Gourmet_Weight_Coefficient)
```

Where:
- `Gourmet_Vote_Ratio`: Ratio of gourmet votes within total votes
- `Gourmet_Weight_Coefficient`: Default 0.25

### Ranking Algorithm

Establishments are sorted according to this formula:

```
Ranking_Score = GurmeScore × Gourmet_Boost × Activity_Factor
```

#### Activity Factor
```
Activity_Factor = 1 + (Last_30_Days_Vote_Count / Total_Votes) × 0.15
```

This factor provides a small advantage to establishments continuously receiving new reviews.

### Fair Competition Mechanism

To prevent excessive advantage from gourmet boost:
- Maximum Gourmet_Boost = 1.30 (maximum 30% increase)
- If gourmet vote ratio > 0.5, increase slows: `Gourmet_Boost = 1.25 + (Gourmet_Vote_Ratio - 0.5) × 0.1`

### Dynamic Ranking

Personalized ranking per user:

```
Personal_Ranking_Score = Ranking_Score × Preference_Match_Factor
```

Where `Preference_Match_Factor` is the degree of match between the user's past preferences and cuisine choices with the establishment.

---

## Formulas and Examples

### Example 1: A New Restaurant

**Situation:**
- Establishment: "Lezzet Durağı" (Flavor Stop)
- Total votes: 5
- Votes: [9.0, 8.5, 9.5, 8.0, 9.0]
- Gourmet vote count: 2
- Platform average: 7.0
- Confidence coefficient (C): 25

**Step 1: Raw Average**
```
Raw_Average = (9.0 + 8.5 + 9.5 + 8.0 + 9.0) / 5 = 8.8
```

**Step 2: Bayesian Weighted Average**
```
Bayesian_Score = (25 × 7.0 + 44.0) / (25 + 5)
                = (175 + 44) / 30
                = 219 / 30
                = 7.3
```

**Step 3: User Weighted Average**
Let's say vote weights are: [3.0, 3.0, 1.0, 1.5, 1.0] (2 gourmet, 1 new, 1 regular, 1 new)

```
Weighted_Score = (9.0×3.0 + 8.5×3.0 + 9.5×1.0 + 8.0×1.5 + 9.0×1.0) / (3.0 + 3.0 + 1.0 + 1.5 + 1.0)
               = (27.0 + 25.5 + 9.5 + 12.0 + 9.0) / 9.5
               = 83.0 / 9.5
               = 8.74
```

**Step 4: Bootstrap Factor (for 0-10 votes)**
```
Bootstrap_Score = (8.74 × 0.3) + (7.0 × 0.7)
                = 2.62 + 4.9
                = 7.52
```

**Step 5: Confidence Factor**
```
Confidence_Factor = min(5 / 100, 1.0) × (2 / 5)
                  = 0.05 × 0.4
                  = 0.02
Confidence_Multiplier = 1 + (Confidence_Factor × 0.1)
                      = 1.002
```

**Step 6: Final GurmeScore**
```
GurmeScore = Bootstrap_Score × Confidence_Multiplier
           = 7.52 × 1.002
           = 7.54
```

**Result:** The restaurant starts in the "Quality" rank and as it gathers more votes, its score will approach 8.7.

---

### Example 2: A Mature Restaurant

**Situation:**
- Establishment: "Gurme Köşe" (Gourmet Corner)
- Total votes: 127
- Raw average: 8.9
- Gourmet vote count: 42 (ratio: 0.33)
- Weighted average: 9.1
- Votes in last 30 days: 8

**Step 1: Bayesian Weighted Average**
```
Bayesian_Score = (25 × 7.0 + 127 × 8.9) / (25 + 127)
                = (175 + 1130.3) / 152
                = 1305.3 / 152
                = 8.59
```

**Step 2: Combined Score**
```
Combined_Score = (0.6 × 9.1 + 0.4 × 8.59)
               = 5.46 + 3.44
               = 8.90
```

**Step 3: Gourmet Boost**
```
Gourmet_Boost = 1 + (0.33 × 0.25)
              = 1 + 0.0825
              = 1.0825
```

**Step 4: Activity Factor**
```
Activity_Factor = 1 + (8 / 127) × 0.15
                = 1 + 0.0094
                = 1.0094
```

**Step 5: Confidence Factor**
```
Confidence_Level = min(127 / 100, 1.0) × 0.33
                 = 1.0 × 0.33
                 = 0.33 (Low-Medium)
Confidence_Multiplier = 1.00 (neutral for mature establishments)
```

**Step 6: Final GurmeScore**
```
GurmeScore = 8.90 × 1.00
           = 8.90
```

**Step 7: Ranking Score**
```
Ranking_Score = 8.90 × 1.0825 × 1.0094
              = 9.72
```

**Result:** The restaurant is in the "Superior Quality" (🌟🌟) rank and appears in top positions on lists.

---

### Example 3: Manipulation Attempt

**Situation:**
- Establishment: "Yeni Mekan" (New Place)
- Current state: 15 votes, average 6.8
- Sudden development: 20 new votes within 1 day (all 10.0)
- 90% of new votes from the same IP block

**Step 1: Sudden Change Detection**
```
Old_Average = 6.8
New_Raw_Average = (15 × 6.8 + 20 × 10.0) / 35
                = (102 + 200) / 35
                = 8.63

Change_Rate = |8.63 - 6.8| / 6.8
            = 1.83 / 6.8
            = 0.269 (26.9%)
```
**Result:** Over 15% change - quarantine activation!

**Step 2: IP/Device Penalty**
18 votes (90%) came from the same IP:
```
Adjusted_Weight = 0.2 × 18 + 1.0 × 2
                = 3.6 + 2.0
                = 5.6 (instead of 20)
```

**Step 3: Timing Penalty**
```
Timing_Penalty = max(0.3, 1 - (20 / 5))
               = max(0.3, 1 - 4)
               = max(0.3, -3)
               = 0.3
```

**Step 4: Adjusted Average**
```
Adjusted_Score = (15 × 6.8 + 5.6 × 10.0 × 0.3) / (15 + 5.6)
               = (102 + 16.8) / 20.6
               = 118.8 / 20.6
               = 5.77
```

**Step 5: GurmeScore Under Quarantine**
Bayesian weight increased (C = 50 instead of 25):
```
Quarantine_Score = (50 × 7.0 + 118.8) / (50 + 20.6)
                 = (350 + 118.8) / 70.6
                 = 468.8 / 70.6
                 = 6.64
```

**Result:** Manipulation attempt failed! Score stayed at 6.64 instead of 8.63. Manual review pending.

---

### Example 4: Time Weighting

**Situation:**
- Establishment: "Klasik Lezzet" (Classic Flavor)
- 5 reviews at different times:
  - Today: 9.0
  - 6 months ago: 8.5
  - 1 year ago: 7.0
  - 2 years ago: 8.0
  - 3 years ago: 9.5

**Step 1: Time Weights** (λ = 0.002)
```
Weight_0    = e^(-0.002 × 0)    = 1.00
Weight_180  = e^(-0.002 × 180)  = 0.70
Weight_365  = e^(-0.002 × 365)  = 0.48
Weight_730  = e^(-0.002 × 730)  = 0.23
Weight_1095 = e^(-0.002 × 1095) = 0.11
```

**Step 2: Time-Weighted Average**
```
Time_Weighted = (9.0×1.00 + 8.5×0.70 + 7.0×0.48 + 8.0×0.23 + 9.5×0.11) / (1.00 + 0.70 + 0.48 + 0.23 + 0.11)
              = (9.0 + 5.95 + 3.36 + 1.84 + 1.045) / 2.52
              = 21.195 / 2.52
              = 8.41
```

**Step 3: Simple Average (Comparison)**
```
Simple_Average = (9.0 + 8.5 + 7.0 + 8.0 + 9.5) / 5
               = 42.0 / 5
               = 8.40
```

**Result:** Time weighting better reflects current quality by giving more importance to recent reviews. In this example, the difference is minimal because the newest score is also close to the oldest.

---

## Conclusion and Best Practices

### System Strengths

1. **Multi-Dimensional Evaluation**: Not just scores, but user reliability, time, and behavior analysis
2. **Manipulation Resistance**: Multi-layered protection mechanisms
3. **Fair Start**: Balanced approach for new establishments
4. **Quality Focus**: Priority to gourmet users' opinions
5. **Dynamic Adaptation**: Adapting to changing conditions over time

### Recommendations for Establishments

- **Consistent Quality**: The best scoring strategy is to consistently deliver high quality
- **Gourmet Interest**: Special events to attract experienced gourmets
- **Active Engagement**: Polite and professional responses to reviews
- **Transparency**: Clear communication about menu, pricing, and service

### Future Enhancements

- Enhanced manipulation detection with machine learning
- Dynamic weighting based on seasonal and venue factors
- Improved confidence scores through social network analysis
- Personalized recommendation algorithms

---

## Additional Resources

- **API Documentation**: GurmeScore calculation endpoints
- **Data Model**: Database schema and relationships
- **Test Scenarios**: Unit and integration tests
- **Performance Metrics**: System performance analysis

---

**Last Updated:** 2026-01-05  
**Version:** 1.0.0  
**License:** Proprietary - Lezzet Atlası Platform

