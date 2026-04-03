# Requirements Document

## Introduction

A client-side web app that helps users track daily spending. Users can add transactions with a default set of categories or create their own, view their total balance, browse a scrollable transaction history, filter by calendar month, and visualize spending through a pie chart. The app supports dark/light mode and persists transactions, categories, and theme preference in Local Storage.

## Glossary

- **App**: The expense & budget visualizer web application
- **Transaction**: A single financial entry with an item name, amount, and category
- **Category**: A label used to group transactions — either a default (Food, Transport, Fun) or a user-defined custom category
- **Balance**: The running total calculated by summing all Transaction amounts
- **Chart**: A pie chart visualizing total spending grouped by Category
- **Transaction_List**: The scrollable list displaying all added Transactions
- **Monthly_View**: The filtered view of Transactions and Chart scoped to a selected calendar month
- **Theme**: The active color scheme of the App — either light or dark
- **Storage**: The browser's Local Storage used to persist app state across sessions

## Requirements

### Requirement 1: Input Form

**User Story:** As a user, I want to fill out a form to add a new transaction, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE App SHALL provide a form with three fields: Item Name (text), Amount (number), and Category (select populated with all available Categories, including defaults: Food, Transport, Fun, and any user-defined Categories).
2. WHEN a user submits the form with all fields filled and a valid positive Amount, THE App SHALL add the Transaction to the Transaction_List and reset the form.
3. IF a user submits the form with any field empty or with a non-positive Amount, THEN THE App SHALL display a validation error and prevent the Transaction from being added.

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my added transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE App SHALL display all Transactions in a scrollable Transaction_List.
2. THE Transaction_List SHALL show the item name, amount, and category for each Transaction.
3. WHEN a user deletes a Transaction, THE App SHALL remove it from the Transaction_List immediately.

### Requirement 3: Balance Display

**User Story:** As a user, I want to see my current total balance at a glance, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the current Balance prominently at the top of the main view.
2. WHEN a Transaction is added or deleted, THE App SHALL recalculate and update the Balance immediately without requiring a page reload.

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a pie chart that displays total spending grouped by Category.
2. WHEN the set of Transactions changes, THE App SHALL update the Chart to reflect the current data without requiring a page reload.
3. THE App SHALL label each segment of the Chart with the Category name and its percentage of total spending, rendered directly on the slice.
4. THE App SHALL assign a distinct color to each Category slice, cycling through a predefined palette when the number of Categories exceeds the palette size.
5. WHILE no Transactions exist, THE App SHALL display a placeholder message instead of an empty Chart.

### Requirement 5: Custom Categories

**User Story:** As a user, I want to create my own spending categories beyond the defaults, so that I can organize transactions in a way that fits my lifestyle.

#### Acceptance Criteria

1. THE App SHALL provide an input field and submit control that allow a user to add a new custom Category.
2. WHEN a user submits a new Category name that is not already present in the Category list (compared case-insensitively), THE App SHALL add it to the available Categories immediately.
3. IF a user submits a Category name that duplicates an existing Category name (case-insensitive), THEN THE App SHALL display a validation error and prevent the duplicate from being added.
4. IF a user submits an empty Category name, THEN THE App SHALL display a validation error and prevent the empty Category from being added.
5. WHEN a custom Category is added, THE App SHALL persist the updated Category list to Storage so that it is available after a page reload.

### Requirement 6: Monthly Summary View

**User Story:** As a user, I want to filter my transactions and chart by calendar month, so that I can review and understand my spending for a specific period.

#### Acceptance Criteria

1. THE App SHALL provide a month selector control that allows the user to choose a calendar month and year.
2. WHEN a user selects a month, THE App SHALL filter the Transaction_List to display only Transactions whose date falls within that calendar month.
3. WHEN a user selects a month, THE App SHALL update the Chart to reflect only the Transactions within that calendar month.
4. WHEN a user selects a month, THE App SHALL display the total spending for that month separately from the overall Balance.
5. WHILE no Transactions exist for the selected month, THE App SHALL display a message indicating no spending data is available for that period instead of an empty list or empty Chart.

### Requirement 7: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between light and dark mode.
2. WHEN a user activates the Theme toggle, THE App SHALL apply the selected Theme to the entire interface immediately without requiring a page reload.
3. WHEN a user activates the Theme toggle, THE App SHALL persist the selected Theme to Storage so that the same Theme is applied on the next page load.
4. WHEN the App loads, THE App SHALL restore the previously persisted Theme from Storage before rendering the interface.

### Requirement 8: Data Persistence

**User Story:** As a user, I want my transactions, categories, and theme preference to be saved automatically, so that my data is still available when I return to the app.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE App SHALL write the current Transaction list to Storage.
2. WHEN a custom Category is added, THE App SHALL write the current Category list to Storage.
3. WHEN the Theme changes, THE App SHALL write the current Theme preference to Storage.
4. WHEN the App loads, THE App SHALL read Transactions, Categories, and Theme from Storage and restore the application state before the interface is displayed.
5. IF Storage is unavailable or contains corrupted data, THEN THE App SHALL fall back to default state (empty Transaction list, default Categories, light Theme) and continue operating without throwing an unhandled error.
