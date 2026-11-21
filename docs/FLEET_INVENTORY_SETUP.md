# Big Jay's Tow Guide — fleet inventory setup

## Purpose

The Fleet tab stores actual Big Jay's truck records on the current device and screens vehicle recommendations against recorded flatbed payload ratings. It is intentionally empty by default: no company truck, capacity, winch, deck size, or equipment is assumed.

## Required operator data

For each unit, enter:

- A unique truck name or unit number.
- Make/model if useful for identification.
- Truck configuration/type.
- Rated usable payload / carrier capacity in pounds from the applicable rating documentation.
- Deck length and width when available.
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
5. Requires a rating-source reference and an explicit supervisor-verification checkbox before a unit can be considered.
6. Lists the lowest-capacity matching flatbed first.

The match does **not** certify axle loading, GCWR, deck dimensions, winch capacity, tie-down ratings, bridge/legal limits, vehicle loading geometry, or condition. The operator must verify all applicable ratings and company procedures before dispatch. A wheel-lift is not silently substituted when a flatbed does not match.

## Storage and rollout limitation

Fleet records are saved in browser/device local storage. A record without a rating-source reference and supervisor verification remains stored for review but is never offered as a match. They do not synchronize between employees or devices, are not backed up centrally, and can be lost if app storage is cleared or the app is reinstalled. For a company-wide fleet, the next step is an authenticated, centrally managed fleet data source with role-based editing, audit history, and a controlled offline cache. Do not treat one phone's entries as the authoritative fleet roster.

## Safe initial setup

Have a supervisor enter each truck from its rating plates, carrier documentation, and equipment records. A second person should verify the numbers. Keep units marked unavailable when the truck or equipment is out of service. Recheck the record whenever the carrier, winch, tires, suspension, or configuration changes.
