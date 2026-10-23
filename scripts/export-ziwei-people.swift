import Foundation

func local(_ v: LocalizedText) -> [String: String] { ["zh": v.zhHant, "en": v.enUS] }

@main struct ExportZiweiPeople {
    static func main() throws {
        let output: [String: Any] = [
            "roles": ZiweiSynastryRoles.roles.mapValues(local),
            "roleLine": local(ZiweiSynastryRoles.line),
            "copy": Dictionary(uniqueKeysWithValues: ZiweiSynastryCopy.keys.map { ($0.rawValue, local(ZiweiStatusCopy.text($0))) }),
            "hourAssumed": local(ZiweiGuidedCopy.hourAssumed),
            "synHourAssumed": local(ZiweiGuidedCopy.synHourAssumed),
        ]
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]))
    }
}
