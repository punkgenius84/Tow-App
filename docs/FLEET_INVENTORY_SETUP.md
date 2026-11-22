# Big Jay's Tow Guide — fleet inventory setup

## Purpose

The Fleet tab stores actual Big Jay's truck records on the current device and screens vehicle recommendations against recorded flatbed payload ratings. It is intentionally empty by default: no company truck, capacity, winch, deck size, or equipment is assumed.

## Wrecker class slots

The Fleet screen provides one setup slot for each Florida wrecker class:

- **Class A — light-duty**
- **Class B — medium-duty**
- **Class C — heavy-duty**

These are placeholders for organizing the fleet, not actual Big Jay's truck records. No unit number, chassis, capacity, winch rating, deck size, availability, or equipment is assumed. Each real truck must be entered from its own rating plate and equipment documentation before it can be considered.

Wrecker class and equipment configuration are separate fields. A rollback/car carrier is a body/equipment configuration; it should not be treated as a separate Class A/B/C wrecker class. Florida's current wrecker rule specifies different chassis and recovery-equipment requirements by class. See [Florida Administrative Code Rule 15B-9.005](https://flrules.elaws.us/fac/15b-9.005). Do not infer that a truck qualifies for a class from its marketing description alone.

## Required operator data

For each unit, enter:

- A unique truck name or unit number.
- Wrecker class (A, B or C), if applicable to the actual approved configuration.
- Make/model if useful for identification.
- Truck configuration/type.
- Rated usable payload / carrier capacity in pounds from the applicable rating documentation.
- Documented usable deck length and width (both required for a fleet candidate).
- Winch line-pull rating when available.
- Whether dollies and skates are carried.
- Current dispatch availability.

Do not enter GVWR as usable payload. GVWR is the maximum permitted loaded vehicle weight, not the amount of vehicle payload the carrier can transport. Record the actual rating that applies to the deck/carrier and configuration.

## How the current match works

The current screening logic:

1. Calculates the vehicle's planning requirement using the existing vehicle weight plus its 15% planning margin.
2. Filters to units marked available.
3. Requires a recorded flatbed configuration.
4. Requires recorded usable payload to meet or exceed the calculated requirement.
5. Requires recorded deck length and width at least as large as the catalog body length and width. If either vehicle dimension or either deck dimension is missing, no candidate is shown. Fleet entry now requires both deck measurements.
6. Requires a rating-source reference and an explicit supervisor-verification checkbox before a unit can be considered.
7. Lists the lowest-capacity candidate first.

The match is only a basic payload and body-envelope screen. Comparing catalog body length/width with recorded deck dimensions does not account for mirrors, protrusions, actual usable deck area, axle loading, GCWR, winch line-pull, tie-down ratings, bridge/legal limits, loading geometry, or equipment condition. The operator must verify all applicable ratings, physical fit, and company procedures before dispatch. A wheel-lift is not silently substituted when a flatbed does not match.

## Storage and rollout limitation

Fleet records are saved in browser/device local storage. A record without a rating-source reference and supervisor verification remains stored for review but is never offered as a match. They do not synchronize between employees or devices, are not backed up centrally, and can be lost if app storage is cleared or the app is reinstalled. For a company-wide fleet, the next step is an authenticated, centrally managed fleet data source with role-based editing, audit history, and a controlled offline cache. Do not treat one phone's entries as the authoritative fleet roster.

## Safe initial setup

Have a supervisor enter each truck from its rating plates, carrier documentation, and equipment records. A second person should verify the numbers. Keep units marked unavailable when the truck or equipment is out of service. Recheck the record whenever the carrier, winch, tires, suspension, or configuration changes.
