import { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import type { MarketBasket } from "../../types/marketBasket";

interface NetworkGraphProps {
  analysis: MarketBasket;
}

export const NetworkGraph = ({ analysis }: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = new Set<string>();
    const edges: {
      from: any;
      to: any;
      label: string;
      title: string;
      width: number;
      color: { color: string };
    }[] = [];

    // Add nodes for products
    analysis.rules.forEach((rule) => {
      rule.antecedents.forEach((product) =>
        nodes.add(product.id + "-" + product.name)
      );
      rule.consequents.forEach((product) =>
        nodes.add(product.id + "-" + product.name)
      );
    });

    const nodeArray = Array.from(nodes).map((node_id_name, index) => ({
      id: index,
      label: node_id_name.split("-").slice(1).join("-"),
      title: node_id_name.split("-").slice(1).join("-"),
    }));

    // Add edges for rules
    analysis.rules.forEach((rule, index) => {
      rule.antecedents.forEach((ant) => {
        rule.consequents.forEach((cons) => {
          const fromNode = nodeArray.find((n) => n.label === ant.name)?.id;
          const toNode = nodeArray.find((n) => n.label === cons.name)?.id;
          if (fromNode !== undefined && toNode !== undefined) {
            edges.push({
              from: fromNode,
              to: toNode,
              label: `C:${(rule.confidence * 100).toFixed(
                1
              )}% L:${rule.lift.toFixed(2)}`,
              title: `Confidence: ${(rule.confidence * 100).toFixed(
                2
              )}%, Lift: ${rule.lift.toFixed(2)}`,
              width: Math.min(rule.confidence * 5, 5),
              color: { color: "#3b82f6" },
            });
          }
        });
      });
    });

    const data = {
      nodes: nodeArray,
      edges,
    };

    const options = {
      height: "500px",
      nodes: {
        shape: "dot",
        size: 20,
        font: { size: 12 },
        color: { background: "#e6f3ff", border: "#3b82f6" },
      },
      edges: {
        arrows: { to: { enabled: true, scale: 0.5 } },
        smooth: { enabled: true, type: "curvedCW", roundness: 0.5 },
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
        },
      },
    };

    const network = new Network(containerRef.current, data, options);

    return () => {
      network.destroy();
    };
  }, [analysis]);

  return <div ref={containerRef} style={{ width: "100%", height: "500px" }} />;
};
