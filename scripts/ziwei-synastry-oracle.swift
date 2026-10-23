import Foundation

struct Pair: Decodable { let first: Ziwei; let second: Ziwei }
@main struct ZiweiSynastryOracle {
    static func main() throws {
        let input = try JSONDecoder().decode(Pair.self, from: FileHandle.standardInput.readDataToEndOfFile())
        guard let comparison = ZiweiSynastry.make(first: input.first, second: input.second) else {
            throw NSError(domain: "ZiweiSynastryOracle", code: 1)
        }
        func placement(_ p: ZiweiSynastry.Placement) -> [String: Any] {
            ["sourceBranch": p.sourceBranch, "targetPalace": p.targetPalace, "targetStars": p.targetStars]
        }
        func direction(_ d: ZiweiSynastry.Direction) -> [String: Any] {
            ["life": placement(d.life), "body": placement(d.body),
             "lifeStars": d.lifeStars.map { ["name": $0.name, "sourceBranch": $0.sourceBranch,
                                          "targetPalace": $0.targetPalace] }]
        }
        let output = ["firstToSecond": direction(comparison.firstToSecond),
                      "secondToFirst": direction(comparison.secondToFirst)]
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]))
    }
}
