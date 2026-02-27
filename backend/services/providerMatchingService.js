const User = require('../models/User');
const Service = require('../models/Service');

// Provider discovery service based on service compatibility and distance heuristics.
class ProviderMatchingService {
  /**
   * Find available providers for a service based on location and category
   * @param {String} serviceId - Service ID
   * @param {Object} customerLocation - Customer's location {latitude, longitude}
   * @param {Number} maxDistance - Maximum distance in km (default: 10)
   * @returns {Array} Array of available providers sorted by distance
   */
  static async findAvailableProviders(serviceId, customerLocation, maxDistance = 10) {
    try {
      // Get service details
      const service = await Service.findById(serviceId).lean();
      if (!service) {
        throw new Error('Service not found');
      }

      // Find approved active providers by explicit service mapping or category fallback
      const providers = await User.find({
        role: 'provider',
        status: 'active',
        approved: true,
        $or: [
          { serviceIds: service._id },
          { category: service.category }
        ]
      }).select('name phone businessName serviceRadiusKm location category serviceIds');

      if (!customerLocation || typeof customerLocation.latitude !== 'number' || typeof customerLocation.longitude !== 'number') {
        return providers.map(provider => ({
          ...provider.toObject(),
          distance: null
        }));
      }

      // Filter providers by distance and calculate distance
      const availableProviders = providers
        .map(provider => {
          const hasCoordinates =
            typeof provider.location?.latitude === 'number' &&
            typeof provider.location?.longitude === 'number';

          if (!hasCoordinates) {
            return null;
          }

          const distance = this.calculateDistance(
            customerLocation.latitude,
            customerLocation.longitude,
            provider.location.latitude,
            provider.location.longitude
          );

          const providerRadius = Number(provider.serviceRadiusKm || maxDistance);
          const radiusLimit = Math.min(providerRadius, maxDistance);

          return {
            ...provider.toObject(),
            distance: distance
          };
        })
        .filter(provider => {
          if (!provider || provider.distance === null) {
            return false;
          }
          const providerRadius = Number(provider.serviceRadiusKm || maxDistance);
          return provider.distance <= Math.min(providerRadius, maxDistance);
        })
        .sort((a, b) => a.distance - b.distance);

      return availableProviders;
    } catch (error) {
      console.error('Error finding available providers:', error);
      throw error;
    }
  }

  /**
   * Assign a provider to a booking
   * @param {String} serviceId - Service ID
   * @param {Object} customerLocation - Customer's location
   * @param {Array} excludeProviderIds - Providers to exclude (already assigned)
   * @returns {Object} Assigned provider or null if none available
   */
  static async assignProvider(serviceId, customerLocation, excludeProviderIds = []) {
    try {
      const availableProviders = await this.findAvailableProviders(serviceId, customerLocation);
      
      // Filter out excluded providers
      let eligibleProviders = availableProviders.filter(
        provider => !excludeProviderIds.includes(provider._id.toString())
      );

      // Fallback to service/category match regardless of geo distance when geo matching has no hit.
      if (eligibleProviders.length === 0 && customerLocation) {
        const nonGeoProviders = await this.findAvailableProviders(serviceId, null);
        eligibleProviders = nonGeoProviders.filter(
          provider => !excludeProviderIds.includes(provider._id.toString())
        );
      }

      if (eligibleProviders.length === 0) {
        return null;
      }

      // Assign closest provider for deterministic matching
      return eligibleProviders[0];
    } catch (error) {
      console.error('Error assigning provider:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Number} lat1 - Latitude of point 1
   * @param {Number} lon1 - Longitude of point 1
   * @param {Number} lat2 - Latitude of point 2
   * @param {Number} lon2 - Longitude of point 2
   * @returns {Number} Distance in kilometers
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {Number} degrees - Degrees
   * @returns {Number} Radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find next available provider for reassignment
   * @param {String} serviceId - Service ID
   * @param {Object} customerLocation - Customer's location
   * @param {Array} excludeProviderIds - Providers to exclude
   * @returns {Object} Next available provider or null
   */
  static async findNextAvailableProvider(serviceId, customerLocation, excludeProviderIds) {
    return await this.assignProvider(serviceId, customerLocation, excludeProviderIds);
  }
}

module.exports = ProviderMatchingService;
