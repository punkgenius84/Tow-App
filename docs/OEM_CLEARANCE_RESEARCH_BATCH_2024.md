# OEM clearance research batch — priority pickups (2024)

**Review status: PARTIAL SOURCE EVIDENCE — NOT VERIFIED FOR THE FULL CATALOG ROWS.**

This batch records primary manufacturer evidence for four high-volume pickup families. It deliberately does not replace the broad app catalog values or promote any row to OEM-verified: each source covers only model year 2024 and shows configuration-dependent dimensions. The existing database rows span multiple years and variants. A single clearance/wheelbase/curb-weight number would be misleading until the catalog can represent the relevant cab, bed, drivetrain, trim, tire and suspension variants.

## Ford F-150 — 2024

Ford Pro's 2024 technical specification PDF documents SuperCrew 5.5-ft ground clearance of 8.5 in (4x2), 9.4 in (4x4), and 9.4 in for Tremor; SuperCrew 6.5-ft is 8.2 in (4x2) and 8.8 in (4x4). Wheelbases vary across the model line: 122.8, 141.5, 145.4, 157.2 and 164.1 in. Ford also documents different cab/bed configurations and drivetrain availability. This is not one universal 2024 F-150 measurement and does not verify the 2015–2025 row. Curb-weight evidence still needs to be added from a scoped Ford source.

Source: https://content.fordpro.com/content/dam/fordpro/us/en-us/pdf/showroom/trucks/f-150/2024/2024_Ford_F-150_Tech_Specs.pdf

## Chevrolet Silverado 2500HD / 3500HD — 2024

Chevrolet's official 2024 Silverado HD specifications document multiple cab/bed/drivetrain combinations. For 2500HD, listed clearance varies from 10.08 to 10.19 in by cab/bed. Wheelbase varies from 141.55 to 172 in by configuration. Base curb weights vary by engine, cab, bed and drive; examples in the published table range from 6,267 to 7,804 lb. The 3500HD clearance is distinct between single- and dual-rear-wheel configurations: published figures range from 10.39 to 11.82 in depending on cab, bed and rear-wheel configuration. These figures cannot be applied to the 2020–2025 catalog rows as a universal value.

Source: https://news.chevrolet.com/newsroom.detail.html/Pages/news/us/en/2022/sep/0926-silverado.html

## Ram 1500 — 2024

The official 2024 Ram 1500 specification PDF states dimensions are measured at curb weight with standard tires and wheels. For standard 275/55R20 examples, ground clearance without skid plate is approximately 8.3–8.7 in; with skid plate, some 4x4 configurations are 8.1–8.2 in. TRX has a separate high-clearance configuration, and optional air suspension has multiple ride-height settings. Wheelbase varies by cab/bed from 140.5 to 153.5 in, with TRX at 145.1 in. The current 2019–2025 app row cannot be promoted or assigned one universal value from this source.

Source: https://s3.amazonaws.com/chryslermedia.iconicweb.com/mediasite/specs/2024_RAM_1500_SP.pdf

## Toyota Tacoma — 2024

Toyota's 2024 US eBrochure documents wheelbase differences: 131.9 in for many 5-ft-bed configurations and 145.1/145.3 in for selected 6-ft-bed configurations. Listed i-FORCE automatic curb weights range from 4,145 to 4,715 lb; i-FORCE MAX values are separately listed from 5,030 to 5,410 lb. The brochure's exterior dimensions table does not provide a numeric ground-clearance specification. Therefore, the existing 9.4-in clearance remains unverified. The 2024 values do not verify 2025 without a separate 2025 primary source.

Source: https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/tacoma_ebrochure.pdf

## Database handling

- The audit CSV now records the 2024 primary source URL, source year and configuration limitations for these four catalog rows.
- Audit status is OEM_SOURCE_PARTIAL; confidence remains LOW_UNVERIFIED.
- Verified clearance, wheelbase and curb-weight fields remain blank because none of these sources supports a single universal value for the broader row.
- No runtime vehicle data, app logic, scanner code, towing recommendation, or APK workflow was changed.
- Next step is to split the high-priority catalog rows by generation and material configuration, then add narrowly scoped single-year/variant records only where a primary source supports them. For any configuration the source does not cover, retain an unknown/unverified state.

## Safety rule

Manufacturer-published ground clearance is measured at a stated vehicle condition and may refer to a specific axle or underbody point. It is not a loading clearance verdict. Operators must still measure the actual vehicle's lowest point and wheelbase on scene and assess approach, departure and breakover geometry.