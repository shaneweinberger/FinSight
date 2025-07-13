import React from 'react';
import SummaryCard from './SummaryCard';

const SummaryCards = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <SummaryCard
          key={card.label}
          label={card.label}
          value={card.value}
          change={card.change}
          changeColor={card.changeColor}
          sub={card.sub}
        />
      ))}
    </div>
  );
};

export default SummaryCards; 