const Instruction = () => {
    return (
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on map to add ONE marker only</li>
          <li>• Use "My Location" to find your current position</li>
          <li>• Clear marker to remove current marker</li>
          <li>• Search for places using the search bar</li>
          <li>• Click marker to see popup</li>
          <li>• Drag to pan, scroll to zoom</li>
          <li>• Use control buttons</li>
        </ul>
      </div>
    );
}

export default Instruction;