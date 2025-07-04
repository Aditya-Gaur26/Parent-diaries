import Growth from '../models/growth.js'; // Adjust path as needed

// POST /api/growth
export const updateGrowth = async (req, res) => {
  try {
    const { childId, ageInMonths, entries } = req.body;

    // Input validation
    if (!childId || !ageInMonths || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    // Validate entry structure
    const isValidEntryStructure = entries.every(entry => 
      entry.type && 
      Array.isArray(entry.details) && 
      entry.details.every(detail => 
        typeof detail.detail === 'string' && 
        typeof detail.completed !== 'undefined'
      )
    );

    if (!isValidEntryStructure) {
      return res.status(400).json({ 
        message: 'Invalid entry structure. Each entry must have type and details array.' 
      });
    }

    // Try to find an existing growth document for the same child and age
    let growth = await Growth.findOne({ childId, ageInMonths });

    if (growth) {
      // Merge entries by type
      entries.forEach(newEntry => {
        const existingEntry = growth.entries.find(e => e.type === newEntry.type);
        if (existingEntry) {
          // Merge details arrays, avoiding duplicates by detail text
          newEntry.details.forEach(newDetail => {
            const existingDetail = existingEntry.details.find(d => d.detail === newDetail.detail);
            if (existingDetail) {
              existingDetail.completed = newDetail.completed;
              if (newDetail.completed) {
                existingDetail.dateCompleted = new Date();
              }
            } else {
              existingEntry.details.push({
                ...newDetail,
                dateCompleted: newDetail.completed ? new Date() : undefined
              });
            }
          });
        } else {
          growth.entries.push({
            ...newEntry,
            details: newEntry.details.map(detail => ({
              ...detail,
              dateCompleted: detail.completed ? new Date() : undefined
            }))
          });
        }
      });
    } else {
      // For new documents, set dateCompleted for completed items
      const processedEntries = entries.map(entry => ({
        ...entry,
        details: entry.details.map(detail => ({
          ...detail,
          dateCompleted: detail.completed ? new Date() : undefined
        }))
      }));

      growth = new Growth({
        childId,
        ageInMonths,
        entries: processedEntries
      });
    }

    await growth.save();
    return res.status(200).json({ message: 'Growth data saved successfully', data: growth });
  } catch (error) {
    console.error('Error saving growth data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/growth/child/:childId?ageInMonths=#
export const getGrowthByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const { ageInMonths } = req.query;

    if (!childId) {
      return res.status(400).json({ message: 'Child ID is required' });
    }

    const query = { childId };
    if (ageInMonths) {
      query.ageInMonths = Number(ageInMonths);
    }

    const growthData = await Growth.find(query).sort({ ageInMonths: 1 });

    // Return empty array instead of 404 error when no data is found
    return res.status(200).json({ data: growthData || [] });
  } catch (error) {
    console.error('Error fetching growth data:', error);
    // Return empty array on error instead of error message
    return res.status(200).json({ data: [] });
  }
};


