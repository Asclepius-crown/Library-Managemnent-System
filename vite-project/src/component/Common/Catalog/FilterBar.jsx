// FilterBar.jsx
export default function FilterBar({
  genres,
  sortOptions,
  selectedGenre,
  setSelectedGenre,
  selectedAvailability,
  setSelectedAvailability,
  selectedSortIndex,
  setSelectedSortIndex,
  searchTerm,
  setSearchTerm,
  setCurrentPage
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <select
        value={selectedGenre}
        onChange={(e) => { setSelectedGenre(e.target.value); setCurrentPage(1); }}
        className="bg-gray-800 p-2 rounded flex-1 sm:flex-none"
      >
        {genres.map((g) => <option key={g}>{g}</option>)}
      </select>
      <select
        value={selectedAvailability}
        onChange={(e) => { setSelectedAvailability(e.target.value); setCurrentPage(1); }}
        className="bg-gray-800 p-2 rounded flex-1 sm:flex-none"
      >
        <option>All</option>
        <option>Available</option>
        <option>Borrowed</option>
      </select>
      <select
        value={selectedSortIndex}
        onChange={(e) => setSelectedSortIndex(Number(e.target.value))}
        className="bg-gray-800 p-2 rounded flex-1 sm:flex-none"
      >
        {sortOptions.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
      </select>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-gray-800 p-2 rounded flex-1"
        aria-label="Search books"
      />
    </div>
  );
}
