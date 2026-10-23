import Foundation

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let decoder = JSONDecoder()
let ruleNames = ["rules-trial-v1", "rules-batch-a-v1", "rules-batch-b-v1", "rules-batch-c-v1"]
let allRules = try ruleNames.flatMap { name in
    try decoder.decode(RuleBundle.self, from: Data(contentsOf: source.appendingPathComponent("App/Resources/Rules/\(name).json"))).rules
}
let rules = RuleBundle(bundleVersion: "rules-v1.0", orbPolicy: "orb-v1", rules: allRules)
let fallbacks = try decoder.decode(FallbackBundle.self, from: Data(contentsOf: source.appendingPathComponent("App/Resources/Rules/fallbacks-v1.json")))
let zone = TimeZone(identifier: "Asia/Taipei")!
let base = BirthInput(year: 1988, month: 5, day: 20, time: .known(hour: 8, minute: 30), latitude: 25.033, longitude: 121.565, timeZoneIdentifier: "Asia/Taipei")
let partial = BirthInput(year: 1988, month: 5, day: 20, time: .unknown, latitude: 25.033, longitude: 121.565, timeZoneIdentifier: "Asia/Taipei")
let iso = ISO8601DateFormatter()
iso.formatOptions = [.withInternetDateTime]

func targetName(_ target: TransitTarget) -> String {
    switch target {
    case .body(let body): return body.rawValue
    case .ascendant: return "ascendant"
    case .midheaven: return "midheaven"
    }
}
func traceJSON(_ trace: TransitAspect) -> [String: Any] {
    ["transiting": trace.transiting.rawValue, "target": targetName(trace.target),
     "kind": trace.kind.rawValue, "orb": trace.orb, "phase": trace.phase.rawValue]
}
func dailyJSON(_ advice: DailyAdvice) -> [String: Any] {
    ["day": iso.string(from: advice.day), "instant": iso.string(from: advice.report.instant),
     "angleTargetsExcluded": advice.report.angleTargetsExcluded,
     "candidates": advice.report.candidates.map(traceJSON),
     "items": advice.items.map { item in
        ["domain": item.domain.rawValue, "title": item.copy.title, "body": item.copy.body,
         "ruleId": item.ruleId as Any? ?? NSNull(),
         "trace": item.trace.map(traceJSON) as Any? ?? NSNull()] as [String: Any]
     }]
}
let date = iso.date(from: "2026-10-23T04:00:00Z")!
var calendar = Calendar(identifier: .gregorian)
calendar.timeZone = zone
let output: [String: Any] = try ["complete", "partial"].map { mode in
    let chart = try NatalChartCalculator.chart(for: mode == "complete" ? base : partial)
    let days = try (0...7).map { offset -> [String: Any] in
        let day = calendar.date(byAdding: .day, value: offset, to: date)!
        return dailyJSON(try DailyAdvisor.advice(for: day, timeZone: zone, chart: chart,
                                                rules: rules, fallbacks: fallbacks, locale: "zh-Hant"))
    }
    return ["mode": mode, "days": days]
}.reduce(into: [:]) { result, entry in result[entry["mode"] as! String] = entry["days"] }
let data = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys, .prettyPrinted])
FileHandle.standardOutput.write(data)
