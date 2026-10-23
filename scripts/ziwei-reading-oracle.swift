import Foundation

@main struct ZiweiReadingOracle {
    static func main() throws {
        let input = FileHandle.standardInput.readDataToEndOfFile()
        let chart = try JSONDecoder().decode(Ziwei.self, from: input)
        let kinds = ZiweiAnalysisKind.allCases.map { kind -> [String: Any] in
            let result = ZiweiAnalysisPresenter.build(kind, ziwei: chart,
                timeLayers: chart.timeLayers, language: .zhHant, isMember: true)
            return ["kind": kind.rawValue, "title": result.title,
                    "unavailable": result.isUnavailable,
                    "sections": result.sections.map { ["heading": $0.heading ?? "", "lines": $0.lines.map(\.text)] }]
        }
        let days = (chart.timeLayersByDay ?? []).enumerated().map { index, layer -> [String: Any] in
            guard let result = ZiweiAnalysisPresenter.day(ziwei: chart, timeLayers: layer,
                language: .zhHant, isToday: index == 0) else {
                return ["date": layer.targetDate, "unavailable": true]
            }
            return ["date": layer.targetDate, "topicLines": result.topicLines.map(\.text),
                    "dayLine": result.dayLine.text, "guides": result.guides.map { $0.action }]
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: ["kinds": kinds, "days": days]))
    }
}
