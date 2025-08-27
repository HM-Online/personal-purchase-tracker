import type { Shipment, Checkpoint } from '../lib/types'; // Import our new types

// The component will receive the 'shipments' array from the purchase object
export default function ShipmentTimeline({ shipments }: { shipments: Shipment[] }) {
  if (!shipments || shipments.length === 0) {
    return <div className="text-gray-400">No shipment information available for this purchase.</div>;
  }

  const shipment = shipments[0];

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Shipment Timeline</h2>
      <div className="mb-4">
        <p><strong>Tracking Number:</strong> {shipment.tracking_number}</p>
        <p><strong>Courier:</strong> {shipment.courier}</p>
      </div>

      <div className="relative border-l-2 border-gray-600 ml-3">
        {(!shipment.checkpoints || shipment.checkpoints.length === 0) ? (
            <div className="mb-8 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-900 rounded-full -left-3 ring-8 ring-gray-900">
                    <svg className="w-2.5 h-2.5 text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z"/><path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold text-white">Tracking Registered</h3>
                <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                    Awaiting first scan from courier...
                </time>
                <p className="text-base font-normal text-gray-400">
                    The tracker has been created in the system. Check back later for updates.
                </p>
            </div>
        ) : (
            // We now use the proper 'Checkpoint' type instead of 'any'
            shipment.checkpoints.map((checkpoint: Checkpoint, index: number) => (
                <div key={index} className="mb-8 ml-6">
                     <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-900 rounded-full -left-3 ring-8 ring-gray-900">
                     </span>
                     <h3 className="font-semibold text-white">{checkpoint.description}</h3>
                     <p className="text-sm text-gray-400">{checkpoint.location}</p>
                     <time className="block text-xs font-normal text-gray-500">
                        {new Date(checkpoint.time).toLocaleString()}
                     </time>
                </div>
            ))
        )}
      </div>
    </div>
  );
}