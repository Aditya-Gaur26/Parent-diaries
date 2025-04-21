import Growth from '../models/growth.js'; // Adjust path as needed

// POST /api/growth
export const updateGrowth = async (req, res) => {
  try {
    const { userId, childId, ageInMonths, entries } = req.body;

    // Input validation
    if (!userId || !childId || !ageInMonths || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    // Try to find an existing growth document for the same child and age
    let growth = await Growth.findOne({ userId, childId, ageInMonths });

    if (growth) {
      // Merge or overwrite entries - Here we overwrite existing entries
      growth.entries = entries;
    } else {
      // Create new entry
      growth = new Growth({
        userId,
        childId,
        ageInMonths,
        entries
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

    if (!growthData.length) {
      return res.status(404).json({ message: 'No growth data found for the specified child' });
    }

    return res.status(200).json({ data: growthData });
  } catch (error) {
    console.error('Error fetching growth data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

