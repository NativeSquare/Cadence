import { View } from "react-native";
import { AnalyticsCard } from "../parts/AnalyticsCard";
import { OptInCard } from "../parts/OptInCard";
import { Subsection } from "../parts/Subsection";
import type { SubsectionConfig } from "../inventory";

type Props = {
  subsections: SubsectionConfig[];
};

export function InventorySection({ subsections }: Props) {
  return (
    <View>
      {subsections.map((sub) => (
        <Subsection key={sub.id} id={sub.id} title={sub.title}>
          {sub.optIn ? (
            <OptInCard cta={sub.optIn} />
          ) : (
            sub.cards.map((card) => <AnalyticsCard key={card.id} card={card} />)
          )}
        </Subsection>
      ))}
    </View>
  );
}
