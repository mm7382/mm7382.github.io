import Foundation

let first = BirthInput(year: 1988, month: 5, day: 20,
    time: .known(hour: 8, minute: 30), latitude: 25.033, longitude: 121.565,
    timeZoneIdentifier: "Asia/Taipei")
let second = BirthInput(year: 1991, month: 9, day: 14,
    time: .known(hour: 14, minute: 5), latitude: 51.507, longitude: -0.128,
    timeZoneIdentifier: "Europe/London")
let partialFirst = BirthInput(year: 1988, month: 5, day: 20,
    time: .unknown, latitude: 25.033, longitude: 121.565,
    timeZoneIdentifier: "Asia/Taipei")
let partialSecond = BirthInput(year: 1991, month: 9, day: 14,
    time: .unknown, latitude: 51.507, longitude: -0.128,
    timeZoneIdentifier: "Europe/London")

func record(_ report: SynastryReport) -> [String: Any] {
    ["hasUnknownTime": report.hasUnknownTime, "orbVersion": report.orbVersion,
     "comparisons": report.comparisons.map { ["point": $0.point.rawValue,
         "firstSigns": $0.firstSigns.map(\.rawValue), "secondSigns": $0.secondSigns.map(\.rawValue)] },
     "aspects": report.aspects.map { ["id": $0.id, "first": $0.first.rawValue,
         "second": $0.second.rawValue, "kind": $0.kind.rawValue,
         "minimumOrb": $0.minimumOrb, "maximumOrb": $0.maximumOrb,
         "unconfirmed": $0.isUnconfirmed] as [String: Any] },
     "basicAspects": report.basicAspects.map(\.id),
     "houseOverlays": report.houseOverlays.map { ["firstInSecond": $0.firstInSecond,
         "body": $0.body.rawValue, "house": $0.house] as [String: Any] }]
}

let a = try NatalChartCalculator.chart(for: first)
let b = try NatalChartCalculator.chart(for: second)
let pa = try NatalChartCalculator.chart(for: partialFirst)
let pb = try NatalChartCalculator.chart(for: partialSecond)
let output: [String: Any] = [
    "complete": record(try SynastryCalculator.report(first: a, second: b)),
    "mixed": record(try SynastryCalculator.report(first: a, second: pb)),
    "partial": record(try SynastryCalculator.report(first: pa, second: pb))]
let data = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys, .prettyPrinted])
FileHandle.standardOutput.write(data)
