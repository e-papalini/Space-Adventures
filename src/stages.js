(function () {
  const order = ['earth', 'preparation-1', 'preparation-2', 'flight', 'research'];
  const labels = { earth: 'Earth', 'preparation-1': 'Preparation Part 1', 'preparation-2': 'Preparation Part 2', flight: 'Flight to destination', research: 'Research' };
  function canEnter(stageId, context) {
    const index = order.indexOf(stageId);
    if (index < 0) return false;
    if (index === 0) return true;
    return Array.isArray(context && context.completedStages) && context.completedStages.includes(order[index - 1]);
  }
  window.GameStageFlow = {
    order: order.slice(),
    labels: Object.assign({}, labels),
    canEnter: canEnter,
    next: function (stageId) {
      const index = order.indexOf(stageId);
      return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
    }
  };
})();